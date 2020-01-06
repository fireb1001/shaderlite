import { bookshelf, knex } from '../main'
import { CustomersCtrl, CustomerTransDAO } from './CustomersCtrl'
import { TransTypesCtrl } from './TransTypesCtrl';
import { CashflowCtrl, CashflowDAO} from './CashflowCtrl'

export class OutgoingDAO {

  id
  day
  income_day    
  supplier_id
  supplier_name
  product_id
  product_name
  customer_id  
  customer_name
  sell_comm
  product_rahn
  sell_comm_value
  kg_price
  weight
  count
  value_calc
  collecting
  notes
  sum_count
  sum_weight

  parseTypes () {
    this.count = parseInt(this.count)
    this.sell_comm = this.sell_comm ? parseFloat(this.sell_comm) : 0
    this.product_rahn = this.product_rahn ? parseFloat(this.product_rahn) : 0
    this.kg_price = this.kg_price ? parseFloat(this.kg_price) : 0
    this.weight = this.weight ? parseFloat(this.weight) : 0
    this.sell_comm_value = this.sell_comm_value ? parseFloat(this.sell_comm_value) : 0
    this.value_calc = this.value_calc ? parseFloat(this.value_calc).toFixed(2) : 0
    delete this.supplier_name
    delete this.product_name
    delete this.customer_name
    delete this.sum_count
    delete this.sum_weight
    delete this.total_weight
    delete this.weight_deduct
  }

  // Constant member
  static get INIT_DAO() {
    return { }
  }

  constructor (data) {
    Object.assign(this, data)
  }
}

export class OutgoingsCtrl {
  /**@type {import('bookshelf').Model} */
  model
  /**@type {TransTypesCtrl} */
  transTypesCtrl


  constructor() {
    this.model = require('../models/OutgoingsModel')(bookshelf)
    this.transTypesCtrl = new TransTypesCtrl()
  }

  /**@param {OutgoingDAO} data */
  async save(data) {
    data.parseTypes()
    let record = await this.model.forge(data).save()
    return record.id
  }

  /**@param {OutgoingDAO} data */
  async saveOutgoingData(data) {
    data = new OutgoingDAO({...data}) // make sure data is not updated after saving
    let out_id = await this.save(data)
    if(data.customer_id){
      let outgoingTrans = await this.transTypesCtrl.findOne({name: 'outgoing', category: 'customer_trans'})
      
      let customerTrans = new CustomerTransDAO()
      customerTrans.transType = outgoingTrans
      customerTrans.day = data.day
      customerTrans.amount = parseFloat(data.value_calc)
      customerTrans.customer_id = data.customer_id
      customerTrans.outgoing_id = out_id
      customerTrans.product_id = data.product_id
      customerTrans.count = data.count
      customerTrans.notes = data.notes

      await new CustomersCtrl().updateDebtByTrans(customerTrans)
      let cashflow_id = null
      // Now adding rahn
      if(data.product_rahn) {
        let rahnTrans = await this.transTypesCtrl.findOne({name: 'product_rahn', category: 'customer_trans'})
        if(rahnTrans.map_cashflow){
          // Create cashflow with trans
          let cashflowTrans = await this.transTypesCtrl.findOne({name: rahnTrans.map_cashflow , category: 'cashflow'})

          let newCashflow = new CashflowDAO({
            amount: parseFloat(data.product_rahn) * parseInt(data.count),
            day:  data.day,
            customer_id: data.customer_id,
            outgoing_id: out_id,
            d_product: data.product_id
          })

          newCashflow.transType = cashflowTrans
          cashflow_id = await new CashflowCtrl().save(newCashflow)
        }

        let customerTrans = new CustomerTransDAO()
        customerTrans.transType = rahnTrans
        customerTrans.day = data.day
        customerTrans.amount = parseFloat(data.product_rahn) * parseInt(data.count)
        customerTrans.customer_id = data.customer_id
        customerTrans.outgoing_id = out_id
        customerTrans.cashflow_id = cashflow_id
        customerTrans.product_id = data.product_id
        customerTrans.notes = data.notes

        await new CustomersCtrl().updateDebtByTrans(customerTrans)
      }

    } else {
      // Create cashflow with outgoing
      let cashflowTrans =  await this.transTypesCtrl.findOne({name: 'outgoing_cash', category: 'cashflow'})
      let cashDAO = new CashflowDAO({
        day: data.day,
        d_product: data.product_id
      })
      cashDAO.transType = cashflowTrans
      cashDAO.outgoing_id = out_id
      cashDAO.amount = parseFloat(data.value_calc)

      await new CashflowCtrl().save(cashDAO)
    }

    return out_id
  }

  async findAll(filter = {}) {
    let all = await this.model.where(filter).fetchAll({withRelated: ['supplier','product','customer']})
    return all.map( _=> {
      let outDAO = new OutgoingDAO(_.attributes)
      outDAO.supplier_name = _.related('supplier').get('name')
      outDAO.product_name = _.related('product').get('name')
      outDAO.customer_name = _.related('customer').get('name')
      return outDAO
    })
  }

  async getLastKgPrice(product_id) {
    let last_kg_price = await knex.raw(`SELECT kg_price from outgoings where product_id = ${product_id} ORDER BY id DESC LIMIT 1`)
    last_kg_price = last_kg_price[0] ? parseFloat(last_kg_price[0].kg_price) : null
    return last_kg_price
  }

  async findDailyCustomers(filter = {day:'',}) {
    let all = await this.model.query(q => {
      q.distinct('customer_id')
      q.whereNotNull('customer_id')
    }).where(filter).orderBy('customer_id','ASC').fetchAll({withRelated: ['customer','customers_daily']})

    return all.map( _=> {
      let outDAO = new OutgoingDAO(_.attributes)
      outDAO.customer_name = _.related('customer').get('name')
      outDAO.printed =  _.related('customers_daily').get('printed')
      return outDAO
    })
  }

  async findSuppDaySums(filter = {supplier_id: null, day: null}){
    let results = await knex('v_out_sums').where('income_day', filter.day)
    .andWhere('supplier_id', filter.supplier_id).orderBy('kg_price', 'desc')
    console.log(filter.day)
    return results.map(item => new OutgoingDAO(item))
  }

  async deleteById(id){
    let instance = await this.model.where('id',id).fetch()
    if(instance){
      await new CustomersCtrl().removeTransByOutgoingId(id)
      await new CashflowCtrl().rawDelete({outgoing_id: id})
      return await instance.destroy()
    }
    else
      return null
  }
}