import { conn2, database_api, db_vendas } from "../../../database/database-connection.ts";
import { api } from "../../../shared/api/api.ts";
import { delay } from "../../../shared/utils/delay.ts";


type resultInvoice = {
      situacao:string 
                                         COD_SITE:number
                                         CHAVE_NFE:string
                                         NUMERO_NF:number
                                         DATA_EMISSAO:string
                                         SERIE:string
                                         XML_NFE:string
}

type resultPutOrder = {
       
      numeroPedido: string,
      idRetorno: number,
      mensagem: 'sucesso' | any,
      xmlInformado: 'sim'
      
}

export class PostInvoiceService {
   static async exec(erpOrderId?:number) {
        let sqlInvoices = `SELECT 
                                        pid.situacao,
                                        co.COD_SITE,
                                        cnf.CHAVE_NFE,
                                        cnf.NUMERO_NF,
                                        cnf.DATA_EMISSAO,
                                        cnf.SERIE,
                                        xf.XML_NFE
                                          FROM ${db_vendas}.cad_orca co 
                                                inner join ${database_api}.pedido_precode pid on co.codigo = pid.codigo_pedido_bd
                                                inner join ${db_vendas}.cad_nf cnf on cnf.pedido = co.codigo
                                                inner join ${db_vendas}.xml_fatur xf on xf.FATUR = cnf.CODIGO
                                                where cnf.CHAVE_NFE != ''
                                                and pid.situacao = 'aprovado' 
                                                `

                                                if(erpOrderId){
                                                    sqlInvoices+=` AND pid.codigo_pedido_bd = '${erpOrderId}' `;
                                                }

            const [ArrresultInvoice] = await conn2.query(sqlInvoices);
            const resultInvoice =ArrresultInvoice as resultInvoice[];
                if(resultInvoice.length >  0 ){
                    for( const invice of resultInvoice){
                        const { CHAVE_NFE, COD_SITE, DATA_EMISSAO, NUMERO_NF, SERIE, XML_NFE , situacao } =invice;
                            const xmlPayload =  Buffer.from(XML_NFE).toString('base64');
                        const payload = {
                                 pedido : [{
                                         codigoPedido : COD_SITE,
                                         chaveNF : String(CHAVE_NFE),
                                         numeroMapa : 0,
                                         xml : xmlPayload,
                                    },
                                ]
                                }
                    
                                await delay(250);

                                try{
                           const responseApiPrecode = await api.put('v1/erp/faturamento', payload) 
                                if(responseApiPrecode.status == 200){
                                    if(responseApiPrecode.data.pedido){
                                        for(const p of responseApiPrecode.data.pedido ){
                                            if(p.numeroPedido){
                                                await conn2.query(`UPDATE ${database_api}.pedido_precode 
                                                        set situacao = 'nota_enviada'    
                                                    `)
                                            }
                                        }
                                    }
                                    console.log(responseApiPrecode.data);
                                }
                            }catch(e:any){
                                    console.log(e);

                                }
                            }   
                }else{
                    console.log("(X) Nenhum pedido pendente para envio.")
                }



    }
}