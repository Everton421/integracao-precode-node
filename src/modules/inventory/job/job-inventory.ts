import { PostInventoryProduct } from "../service/post-inventory-product.ts";

import cron from 'node-cron';
export class JobInventory { 
   static async  job(){

        const cronConfig = process.env.ATUALIZAR_INVENTARIO ||  '*/50 * * * *';
    console.log(`[V] Tarefa de inventario agendada ${cronConfig} ...`)
       cron.schedule( cronConfig , async () => {
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

    }
}

