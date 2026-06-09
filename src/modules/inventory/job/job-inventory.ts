import { PostInventoryProduct } from "../service/post-inventory-product.ts";

import cron from 'node-cron';

       cron.schedule(" */50 * * * * ", async () => {
            console.log('Executando tarefa [ Inventario ] ...')

                let inExecution = false;
                try{
                    if(inExecution){
                        return console.log("[X] Tarefa de envio do inventario ainda em execução...");
                    }
                    inExecution = true
                   await PostInventoryProduct.postInventory();
                }catch( e ){

                }finally{
                  inExecution = false;
                }


    })