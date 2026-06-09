import axios from "axios";

export const api = axios.create({
       baseURL: process.env.API_URL!,
       headers:{
              "authorization": process.env.API_TOKEN!,
              "cache-control": "no-cache",
            "content-type": "application/json"
       }
})