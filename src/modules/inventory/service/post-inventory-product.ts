import { isAxiosError } from "axios";
import { conn2, database_api, db_estoque, db_publico, db_vendas } from "../../../database/database-connection.ts";
import { api } from "../../../shared/api/api.ts";
import { DateService } from "../../../shared/utils/date-service.ts";
import { delay } from "../../../shared/utils/delay.ts";


type ProductInventory = {
    CODIGO: number,
    OUTRO_COD: string,
    CODIGO_SITE: number,
    ESTOQUE: number,
    DATA_RECAD: string
}


type ProductPrice = {
    OUTRO_COD: string,
    PRECO_SITE: string,
    PRECO: string,
    DATA_RECAD: string,
    DATA_RECAD_PRECO: string
  }

export class PostInventoryProduct { 
    static async  postInventory(){

                             const sql = `			SELECT  
                                                        est.CODIGO, est.OUTRO_COD, est.CODIGO_SITE,
                                                            IF(est.estoque < 0, 0, est.estoque) AS ESTOQUE,
                                                            est.DATA_RECAD
                                                        FROM 
                                                            (SELECT
                                                            P.CODIGO, P.OUTRO_COD , pp.CODIGO_SITE,
                                                            PS.DATA_RECAD,
                                                            (SUM(PS.ESTOQUE) - 
                                                                (SELECT COALESCE(SUM((IF(PO.QTDE_SEPARADA > (PO.QUANTIDADE - PO.QTDE_MOV), PO.QTDE_SEPARADA, (PO.QUANTIDADE - PO.QTDE_MOV)) * PO.																																	FATOR_QTDE) * IF(CO.TIPO = '5', -1, 1)), 0)
                                                                FROM ${db_vendas}.cad_orca AS CO
                                                                LEFT OUTER JOIN ${db_vendas}.pro_orca AS PO ON PO.ORCAMENTO = CO.CODIGO
                                                                WHERE CO.SITUACAO IN ('AI', 'AP', 'FP')
                                                                AND PO.PRODUTO = P.CODIGO)) AS estoque
                                                            FROM ${db_estoque}.prod_setor AS PS
                                                            LEFT JOIN ${db_publico}.cad_prod AS P ON P.CODIGO = PS.PRODUTO AND P.ATIVO = 'S'
															 JOIN ${database_api}.produto_precode pp ON pp.CODIGO_BD = P.CODIGO
                                                            INNER JOIN ${db_publico}.cad_pgru AS G ON P.GRUPO = G.CODIGO
                                                            LEFT JOIN ${db_estoque}.setores AS S ON PS.SETOR = S.CODIGO
                                                        WHERE 
															 PS.SETOR = 1
                                                            GROUP BY P.CODIGO) AS est;`

        const [ responseInventoryProducts ] = await conn2.query(sql);

        const inventoryProducts = responseInventoryProducts as ProductInventory[];
        const dateNow = DateService.obterDataHoraAtual();

        
        console.log(`[V] iniciando envio do inventario, ${inventoryProducts.length} produtos ...`);

        for( const inventory of inventoryProducts){
    
                const {CODIGO, ESTOQUE } =inventory;

            const sqlPrices = `
                                  SELECT 
                                                 cp.OUTRO_COD ,
                                                 pp.PRECO_SITE,
                                                 p.PRECO,
                                                 p.DATA_RECAD,
                                                 COALESCE(pp.DATA_RECAD_PRECO, '2001-01-01 00:00:00') AS DATA_RECAD_PRECO
                                              FROM  ${db_publico}.cad_prod cp
                                              JOIN ${db_publico}.prod_tabprecos p ON cp.CODIGO = p.PRODUTO
                                              JOIN ${database_api}.produto_precode pp ON pp.CODIGO_BD = cp.CODIGO
                                               WHERE p.PRODUTO = '${CODIGO}' AND p.TABELA = 1 ;`
                 
                                               const [resultErpPriceProduct] = await conn2.query(sqlPrices);
                    const priceProduct = resultErpPriceProduct as ProductPrice[];
 
                    let price =  0.00 ;
                   
                    if(priceProduct.length > 0 ){
                       price = Number(priceProduct[0].PRECO) ;
                    }
                    
                 try{
                    delay(500, ` Atualização do inventario do produto ${CODIGO} `);
                    const responseApiPrecode = await api.put('v3/products/inventory',
                        {
                           
                            "products": [{
                                "ref": String(CODIGO),
                                "sku": null,
                                "promotional_price": price   ,
                                "price": price,
                                "priceSite": price,
                                "cost": 0,
                                "shippingTime": 0,
                                "status": "enabled",
                                "stock": [{
                                    "stores": 1,
                                    "availableStock":  Number(ESTOQUE),
                                    "realStock":  Number(ESTOQUE)
                                }]
                            }]
                        }
                    )
                 
                    if(responseApiPrecode.status == 200 || responseApiPrecode.status == 201){

                                const sqlUpdateInventory = ` UPDATE ${database_api}.produto_precode set DATA_RECAD_PRECO =  '${dateNow}', DATA_RECAD_ESTOQUE = '${dateNow}', SALDO_ENVIADO ='${ESTOQUE}' , PRECO_SITE ='${price}' 
                                    WHERE CODIGO_BD = '${CODIGO}';
                                `; 
                         const [resultUpdate] =   await conn2.query(sqlUpdateInventory);
                        console.log(`  ${responseApiPrecode.data.products[0].return[0].message}`);
                        console.log(`[V]  atualizado produtos ${CODIGO} preço: $${price}, estoque: ${ESTOQUE}`);
                    }
                }catch(e){
                    if( isAxiosError(e)){
                        console.log("erro ao tentar enviar o saldo e o preço.")
                        console.log(e.response?.data)
                    }
                }
                 
        }
        console.log(`[V]  fim do envio do inventario.`);

    }   
}