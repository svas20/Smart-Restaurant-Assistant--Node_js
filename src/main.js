import { result } from "./model.js";
export default async function main(order_number,customer_order) {
    //let order_summary = null;
    let assistant_response = ""; 
        //console.log("customer order: ",customer_order);
        assistant_response = await result(customer_order, order_number);
        //console.log("assistance response:",assistant_response);
    return assistant_response
}
