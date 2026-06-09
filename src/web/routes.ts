import { Router } from "express";

import 'dotenv/config';
import { PostInventoryProduct } from "../modules/inventory/service/post-inventory-product.ts";
const router = Router();

router.get('/', async (req, res) => {
   await PostInventoryProduct.postInventory()
})
 

export { router };


