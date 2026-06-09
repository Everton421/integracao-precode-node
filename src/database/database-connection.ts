 // import 'dotenv/config';
import mysql from 'mysql2/promise';

/**----------------------------------------------------------------------- */
        const hostname = process.env.DB_HOST! ;
        const portdb =Number(process.env.DB_PORT_DB!);
        const username = process.env.DB_USER!;
        const dbpassword = process.env.DB_PASSWORD!;

        export const db_publico = process.env.DB_PUBLICO;
        export const db_vendas = process.env.DB_VENDAS;
        export const db_estoque = process.env.DB_ESTOQUE;
        export const db_financeiro = process.env.DB_FINANCEIRO;

        export const database_api =process.env.DB_API
 
        export const conn2  = await  mysql.createPool({
            connectionLimit : 10,
            host: hostname,
            user: String(username),
            port: portdb,
            password: String(dbpassword),
        })

/**----------------------------------------------------------------------- */

 