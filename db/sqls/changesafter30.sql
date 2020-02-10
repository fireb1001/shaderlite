-- 1.43
-- Solve PRAGMA foreign_key_check;
-- select * from receipts where cashflow_id not in (select id from cashflow);

alter TABLE trans_types add COLUMN map_customer_trans TEXT;
alter TABLE trans_types add COLUMN sum_rahn TEXT;
alter TABLE trans_types add COLUMN flags TEXT;

update trans_types set flags = 'DEDUCT' where optional = 1;
update trans_types set flags = 'CUST_FORM' where optional = 3;

INSERT INTO "trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow", "map_customer_trans", "sum_rahn", "flags")
VALUES ('repay_rahn_auto', 'تنزيل رهن بدون تأثير علي الحساب', 'default', '-', '', 'customer_trans', '', 'coll_anti_rahn', '', 'CUST_FORM');

update "shader_configs" set config_value='1.43' where config_name = 'MANUAL_UPGRADED_TO';
-- change CUST_FORM for coll_anti_rahn
-- rename repay_rahn_internal label
--- 
PRAGMA foreign_keys = 0;

CREATE TABLE sqlitestudio_temp_table AS SELECT *
                                          FROM receipts;

DROP TABLE receipts;

CREATE TABLE receipts (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id        INTEGER NOT NULL,
    day                TEXT    NOT NULL,
    total_nolon        REAL,
    recp_given         REAL,
    comm_rate          REAL,
    sale_value         REAL,
    net_value          REAL,
    recp_paid          INTEGER,
    products_arr       TEXT,
    total_current_rest INTEGER,
    total_count        INTEGER,
    total_sell_comm    REAL,
    recp_comm          REAL,
    supplier_name      TEXT,
    out_sale_value     REAL,
    recp_expenses      REAL,
    serial             INTEGER,
    printed            INTEGER,
    recp_deducts       REAL,
    balance_was        REAL,
    recp_others        REAL,
    cashflow_id        INTEGER,
    FOREIGN KEY (
        cashflow_id
    )
    REFERENCES cashflow (id) ON DELETE RESTRICT
);

INSERT INTO receipts (
                         id,
                         supplier_id,
                         day,
                         total_nolon,
                         recp_given,
                         comm_rate,
                         sale_value,
                         net_value,
                         recp_paid,
                         products_arr,
                         total_current_rest,
                         total_count,
                         total_sell_comm,
                         recp_comm,
                         supplier_name,
                         out_sale_value,
                         recp_expenses,
                         serial,
                         printed,
                         recp_deducts,
                         balance_was,
                         recp_others,
                         cashflow_id
                     )
                     SELECT id,
                            supplier_id,
                            day,
                            total_nolon,
                            recp_given,
                            comm_rate,
                            sale_value,
                            net_value,
                            recp_paid,
                            products_arr,
                            total_current_rest,
                            total_count,
                            total_sell_comm,
                            recp_comm,
                            supplier_name,
                            out_sale_value,
                            recp_expenses,
                            serial,
                            printed,
                            recp_deducts,
                            balance_was,
                            recp_others,
                            cashflow_id
                       FROM sqlitestudio_temp_table;

DROP TABLE sqlitestudio_temp_table;

PRAGMA foreign_keys = 1;

-- 1.42


INSERT INTO "shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category")
VALUES ('sum_capital', 'اجمالي رأس المال', '', 'default', 'label');

INSERT INTO "shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category") 
VALUES ('sum_rasd', 'اجمالي الرصد', '', 'default', 'label');

CREATE TABLE "daily_close" (
	"day"	TEXT NOT NULL,
	"closed"	TEXT,
	"net_cash"	REAL,
	"json"	TEXT,
	PRIMARY KEY("day")
);

/**  only 4 mmn1

INSERT INTO "shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category") 
VALUES ('F_MMN1_PASS', '4242', '', 'mmn1', 'config');

insert into daily_close ('day', 'closed') 
select DISTINCT(day), 'true' as true from cashflow where day < '2020-02-05';
*/

-- 1.41
-- https://github.com/fireb1001/shaderlite/releases/

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category") 
VALUES ('dealer_init', 'رصيد', 'default', '+', '', 'dealer_trans');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow") 
VALUES ('dealer_pay', 'دفع تعامل', 'default', '+', '', 'dealer_trans', 'dealer_pay');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow") 
VALUES ('dealer_pay', 'دفع تعامل', 'default', '-', '', 'cashflow', '');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow") 
VALUES ('dealer_collect', 'تحصيل تعامل', 'default', '-', '', 'dealer_trans', 'dealer_collect');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow") 
VALUES ('dealer_collect', 'تحصيل تعامل', 'default', '+', '', 'cashflow', '');

INSERT INTO "main"."shader_configs" 
("config_name", "config_value", "config_verify", "shader_name", "category") 
VALUES ('manage_dealers', 'ادارة المعاملات', '', 'default', 'label');


alter TABLE cashflow add dealer_id INTEGER;

CREATE TABLE dealers (
	id	INTEGER PRIMARY KEY AUTOINCREMENT,
	name	TEXT NOT NULL UNIQUE,
	phone	TEXT,
	deleted_at	INTEGER,
	balance REAL,
	notes	TEXT
);


CREATE TABLE dealer_trans (id INTEGER PRIMARY KEY AUTOINCREMENT,
day TEXT NOT NULL,
dealer_id INTEGER NOT NULL,
cashflow_id INTEGER,
amount REAL,
trans_type TEXT,
sum TEXT,
notes TEXT, FOREIGN KEY (dealer_id) REFERENCES dealers (id));


-- version 1.40
ALTER TABLE products add cust_mashal REAL;

-- version 1.38
INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category") 
VALUES ('init_mashal', '.35', '', 'amn1', 'config');
ALTER TABLE suppliers add box_count INTEGER;


-- version 1.35 

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category")
VALUES ('F_AARBON_OUT', 'true', '', 'mmn1', 'config');

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category")
VALUES ('F_RECP_EXPENSES_INC', 'true', '', 'mmn1', 'config');

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category")
VALUES ('F_REPAY_RAHN_KASHF', 'true', '', 'mmn1', 'config');

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category")
VALUES ('F_AARBON_KASHF', 'true', '', 'mmn1', 'config');

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category")
VALUES ('F_SHOW_DEBT_KASHF', 'true', '', 'mmn1', 'config');

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category") 
VALUES ('shader_name', 'nada', '', 'default', 'config');

-- version 1.33 -- 
ALTER TABLE receipts add cashflow_id INTEGER;
ALTER TABLE cashflow add income_day TEXT;
update cashflow set income_day = day where state = 'supp_recp_expenses';

-- Add Net Weight option
ALTER TABLE products add weight_deduct REAL;


--- ------------------------

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('product_rahn_external', 'رهن', 'default', '+', '3', 'customer_trans');
-- config.json file
INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow")
VALUES ('aarbon', 'عربون', 'default', '-', '', 'customer_trans', 'aarbon');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow")
VALUES ('aarbon', 'عربون', 'default', '+', '', 'cashflow', '');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category", "map_cashflow")
VALUES ('repay_rahn_internal', 'عربون', 'default', '-', '', 'customer_trans', '');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('ex_comm', 'عمولة + بياعة', 'default', '-', '', 'cashflow');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('ex_mashal', 'اجمالي المشال', 'default', '-', '', 'cashflow');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('ex_momen', 'حساب شركاء - معلم مؤمن', 'default', '-', '', 'cashflow');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('ex_said', 'حساب شركاء - معلم السيد', 'default', '-', '', 'cashflow');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('ex_mohamed', 'مصروف كاتب استاذ محمد', 'default', '-', '1', 'cashflow');

INSERT INTO "main"."trans_types" ("name", "ar_name", "shader_name", "sum", "optional", "category")
VALUES ('ex_hisham', 'مصروف كاتب استاذ هشام', 'default', '-', '1', 'cashflow');

INSERT INTO "main"."shader_configs" ("config_name", "config_value", "config_verify", "shader_name", "category") 
VALUES ('init_recp_given', '1', '', 'mmn1', 'config');


