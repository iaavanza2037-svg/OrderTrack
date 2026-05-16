export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion?: string;
  observaciones?: string;
  fechaRegistro: string;
}

export interface Tienda {
  id: string;
  nombre: string;
  pais: string;
  sitioWeb?: string;
  notas?: string;
}

export enum EstadoPedido {
  PENDIENTE = "Pendiente",
  COMPRADO = "Comprado",
  EN_TRANSITO = "En tránsito",
  PRODUCTO_LLEGO = "Producto llegó",
  ENTREGADO = "Entregado",
  CANCELADO = "Cancelado",
  VENCIDO = "Vencido",
}

export interface Pedido {
  id: string;
  clienteId: string;
  tiendaId: string;
  descripcion: string;
  categoria?: string;
  enlaceProducto?: string;
  precioCompra: number;
  precioVenta: number;
  ganancia: number;
  fechaPedido: string;
  fechaLlegada?: string;
  estado: EstadoPedido;
  entregado: boolean;
  fotoBase64?: string;
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface AppData {
  clientes: Cliente[];
  tiendas: Tienda[];
  pedidos: Pedido[];
  configuracion: {
    whatsappTemplate: string;
  };
}
