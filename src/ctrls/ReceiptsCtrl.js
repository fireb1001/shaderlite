import { bookshelf, knex } from '../main'

export class ReceiptDAO {
  
  id
  day
  supplier_id
  supplier_name
  total_nolon 
  recp_given
  comm_rate
  sale_value
  net_value
  recp_paid
  total_current_rest
  total_count
  total_sell_comm
  recp_comm
  out_sale_value
  recp_expenses
  details = []
  products_arr
  serial

  static get INIT_DAO() {
    return { 
      recp_paid: 0
    }
  }

  constructor( data= {} ){
    Object.assign(this, data)
  }
  
  parseTypes() { 
    // this.details= this.details? JSON.stringify(this.details) : null
    delete this.details
  }
}

export class ReceiptDetailDAO {

  id
  receipt_id
  day
  supplier_id
  kg_price
  product_id
  weight
  count

  constructor( data= {} ){
    Object.assign(this, data)
  }
  
  parseTypes() { 
  }
}

export class ReceiptsCtrl {
  /**@type {import('bookshelf').Model} */
  model
  /**@type {import('bookshelf').Collection} */
  detailsColl

  constructor() {
    this.model = require('../models/ReceiptsModel')(bookshelf).model
    this.detailsColl = require('../models/ReceiptsModel')(bookshelf).detailsColl
  }

  /**@param {ReceiptDAO} data */
  async save(data) {
    let details_arr = data.details
    data.products_arr = details_arr.map(detail => detail.product_id).join(',')

    data.parseTypes()
    if(data.id) {
      let ok = await this.deleteDetailsById(data.id)
      console.log("ok deleted", ok)
    }
    let record = await this.model.forge(data).save()

    details_arr.forEach(item => {
      delete item.id
      item.receipt_id = record.id
    })

    let recp_details = this.detailsColl.forge(details_arr)
    await recp_details.invokeThen('save')

    return record.id
  }

  /**@returns {Array} */
  async findAll(filter = {}) {
    let all = await this.model.where(filter).fetchAll({withRelated: ['supplier','details']})
    return all.map( _=> {
      let dao = new ReceiptDAO(_.attributes)
      dao.supplier_name = _.related('supplier').get('name')
      /**@type {Array} */
      let details = _.related('details').toJSON()
      details.forEach(record => {
        dao.details.push(new ReceiptDetailDAO(record))
      })
      return dao
    })
  }

  /**@returns {Array} */
  async findDailyReceipts(filter = {day: null}) {
    let query = `
SELECT 
day,
recp_gsums.supplier_id as supplier_id,
suppliers.name as supplier_name,
sum_recp_comm,
sum_sale_value,
sum_net_value,
sum_total_nolon,
sum_recp_expenses,
sum_recp_given,
sum_total_count,
concat_recp_paid,
sum_out_value,
sum_sell_comm,
products_concat
FROM 
    (SELECT 
    day as day,
    supplier_id as supplier_id,
    sum(recp_comm) as sum_recp_comm,
    sum(sale_value) as sum_sale_value,
    sum(net_value) as sum_net_value,
    sum(total_nolon) as sum_total_nolon ,
    sum(total_count) as sum_total_count ,
    sum(recp_given) as sum_recp_given ,
    sum(recp_expenses) as sum_recp_expenses,
    group_concat(recp_paid) as concat_recp_paid
    from receipts 
    GROUP by supplier_id, day) recp_gsums
  JOIN 
    (SELECT income_day,	
    supplier_id,
    sum(kg_price *weight) as sum_out_value ,
    sum(sell_comm * count) as sum_sell_comm ,
    group_concat(DISTINCT(product_id)) as products_concat
    FROM outgoings
    GROUP BY income_day, supplier_id, sell_comm ) out_gsums
  ON  
    recp_gsums.day = out_gsums.income_day and recp_gsums.supplier_id = out_gsums.supplier_id
  JOIN
    suppliers on recp_gsums.supplier_id = suppliers.id
WHERE
recp_gsums.day = '${filter.day}'`
  
    return await knex.raw(query)
  }

  async deleteById(id){
    let instance = await this.model.where('id',id).fetch({withRelated:['details']})
    if(instance) {
      await instance.details().invokeThen('destroy')
      return await instance.destroy()
    }
    else
      return null
  }

  async deleteDetailsById(id) {
    /*
    let instance = await this.model.where('id',id).fetch({withRelated:['details']})
    console.log(instance, instance.details())
    return await instance.related('details').invokeThen('destroy')
    */
    await knex.raw('delete from receipt_details where receipt_id = ' + id)
    /* */
  }

}