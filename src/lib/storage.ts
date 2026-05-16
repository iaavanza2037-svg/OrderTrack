import { AppData, Cliente, Pedido, Tienda } from "./types";

const STORAGE_KEYS = {
  CLIENTES: "pedidosPro_clientes",
  TIENDAS: "pedidosPro_tiendas",
  PEDIDOS: "pedidosPro_pedidos",
  CONFIG: "pedidosPro_configuracion",
};

export const getStorageData = (): AppData => {
  return {
    clientes: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || "[]"),
    tiendas: JSON.parse(localStorage.getItem(STORAGE_KEYS.TIENDAS) || "[]"),
    pedidos: JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || "[]"),
    configuracion: JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CONFIG) ||
        JSON.stringify({
          whatsappTemplate: "Hola {cliente}, tu pedido \"{producto}\" de {tienda} ya llegó y está disponible para entrega. Total a pagar: L {precio}. Gracias por tu preferencia.",
        })
    ),
  };
};

export const saveStorageData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(data.clientes));
  localStorage.setItem(STORAGE_KEYS.TIENDAS, JSON.stringify(data.tiendas));
  localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(data.pedidos));
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.configuracion));
};

export const exportToJSON = (data: AppData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `respaldo_pedidos_pro_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJSON = async (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error("Archivo JSON inválido"));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsText(file);
  });
};
