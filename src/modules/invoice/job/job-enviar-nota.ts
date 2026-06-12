
import cron from 'node-cron';
import { PostInvoiceService } from '../service/post-invoice-service.ts';
export class JobInvoices { 
   static async  job(){

        const cronConfig = process.env.ENVIAR_NOTAS ||  '*/50 * * * *';
    console.log(`[V] Tarefa de envio de notas agendada ${cronConfig} ...`)
       cron.schedule( cronConfig , async () => {
            console.log('Executando tarefa [ notas ] ...')

                let inExecution = false;
                try{
                    if(inExecution){
                        return console.log("[X] Tarefa de envio de notas ainda em execução...");
                    }
                    inExecution = true
                   await PostInvoiceService.exec();
                }catch( e ){

                }finally{
                  inExecution = false;
                }

    })

    }
}

