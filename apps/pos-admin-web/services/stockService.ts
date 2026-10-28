/// <reference types="vite/client" />
//import axios from "axios";
import { api } from "../src/api/axios";

//const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface BranchStockItem {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string; //
    price: number;
  };
}

export const fetchStocksByBranch = async (
  branchId: string,
): Promise<BranchStockItem[]> => {
  // const response = await api.get(`${API_BASE_URL}/branch-stocks/${branchId}`);
  const response = await api.get(`/branch-stocks/${branchId}`);

  return response.data;
};
