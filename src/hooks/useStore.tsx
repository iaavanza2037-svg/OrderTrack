import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData, Cliente, Tienda, Pedido, EstadoPedido } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface StoreContextType {
  data: AppData;
  isLoading: boolean;
  addCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => Promise<void>;
  updateCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  addTienda: (tienda: Omit<Tienda, 'id'>) => Promise<void>;
  updateTienda: (id: string, tienda: Partial<Tienda>) => Promise<void>;
  deleteTienda: (id: string) => Promise<void>;
  addPedido: (pedido: Omit<Pedido, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'ganancia'>) => Promise<void>;
  updatePedido: (id: string, pedido: Partial<Pedido>) => Promise<void>;
  deletePedido: (id: string) => Promise<void>;
  updateConfig: (config: AppData['configuracion']) => Promise<void>;
  importData: (newData: AppData) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_CONFIG = {
  whatsappTemplate: "Hola *{cliente}*, tu pedido \"*{producto}*\" de *{tienda}* ya cambió de estado a: *{estado}*. Total a pagar: L {precio}. Gracias por tu preferencia."
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>({
    clientes: [],
    tiendas: [],
    pedidos: [],
    configuracion: INITIAL_CONFIG
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setData({ clientes: [], tiendas: [], pedidos: [], configuracion: INITIAL_CONFIG });
      return;
    }

    const userId = user.uid;
    setIsLoading(true);

    const unsubConfig = onSnapshot(doc(db, `users/${userId}/config`, 'settings'), (snapshot) => {
      if (snapshot.exists()) {
        setData(prev => ({ ...prev, configuracion: snapshot.data() as AppData['configuracion'] }));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/config/settings`));

    const unsubClientes = onSnapshot(collection(db, `users/${userId}/clientes`), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Cliente));
      setData(prev => ({ ...prev, clientes: docs }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/clientes`));

    const unsubTiendas = onSnapshot(collection(db, `users/${userId}/tiendas`), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Tienda));
      setData(prev => ({ ...prev, tiendas: docs }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/tiendas`));

    const unsubPedidos = onSnapshot(collection(db, `users/${userId}/pedidos`), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Pedido));
      setData(prev => ({ ...prev, pedidos: docs }));
      setIsLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/pedidos`));

    return () => {
      unsubConfig();
      unsubClientes();
      unsubTiendas();
      unsubPedidos();
    };
  }, [user]);

  const addCliente = async (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
    const id = crypto.randomUUID();
    const path = `users/${user?.uid}/clientes/${id}`;
    try {
      await setDoc(doc(db, path), {
        ...cliente,
        id,
        uid: user?.uid,
        fechaRegistro: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updateCliente = async (id: string, updated: Partial<Cliente>) => {
    const path = `users/${user?.uid}/clientes/${id}`;
    try {
      await updateDoc(doc(db, path), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteCliente = async (id: string) => {
    const userId = user?.uid;
    const path = `users/${userId}/clientes/${id}`;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, path));
      data.pedidos.filter(p => p.clienteId === id).forEach(p => {
        batch.delete(doc(db, `users/${userId}/pedidos/${p.id}`));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const addTienda = async (tienda: Omit<Tienda, 'id'>) => {
    const id = crypto.randomUUID();
    const path = `users/${user?.uid}/tiendas/${id}`;
    try {
      await setDoc(doc(db, path), {
        ...tienda,
        id,
        uid: user?.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updateTienda = async (id: string, updated: Partial<Tienda>) => {
    const path = `users/${user?.uid}/tiendas/${id}`;
    try {
      await updateDoc(doc(db, path), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTienda = async (id: string) => {
    const userId = user?.uid;
    const path = `users/${userId}/tiendas/${id}`;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, path));
      data.pedidos.filter(p => p.tiendaId === id).forEach(p => {
        batch.delete(doc(db, `users/${userId}/pedidos/${p.id}`));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const addPedido = async (pedido: Omit<Pedido, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'ganancia'>) => {
    const id = crypto.randomUUID();
    const userId = user?.uid;
    const path = `users/${userId}/pedidos/${id}`;
    const ganancia = pedido.precioVenta - pedido.precioCompra;
    try {
      await setDoc(doc(db, path), {
        ...pedido,
        id,
        uid: userId,
        ganancia,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updatePedido = async (id: string, updated: Partial<Pedido>) => {
    const path = `users/${user?.uid}/pedidos/${id}`;
    try {
      const current = data.pedidos.find(p => p.id === id);
      if (!current) return;
      const next = { ...current, ...updated };
      const ganancia = next.precioVenta - next.precioCompra;
      await updateDoc(doc(db, path), {
        ...updated,
        ganancia,
        fechaActualizacion: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deletePedido = async (id: string) => {
    const path = `users/${user?.uid}/pedidos/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const updateConfig = async (configuracion: AppData['configuracion']) => {
    const path = `users/${user?.uid}/config/settings`;
    try {
      await setDoc(doc(db, path), { ...configuracion, uid: user?.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const importData = async (newData: AppData) => {
    // Basic import logic - might need batching for large sets
    const userId = user?.uid;
    if (!userId) return;
    const batch = writeBatch(db);
    
    // This is a simplified import for brevity
    newData.clientes.forEach(c => {
      const ref = doc(db, `users/${userId}/clientes/${c.id}`);
      batch.set(ref, { ...c, uid: userId });
    });
    newData.tiendas.forEach(t => {
      const ref = doc(db, `users/${userId}/tiendas/${t.id}`);
      batch.set(ref, { ...t, uid: userId });
    });
    newData.pedidos.forEach(p => {
      const ref = doc(db, `users/${userId}/pedidos/${p.id}`);
      batch.set(ref, { ...p, uid: userId });
    });
    
    await batch.commit();
  };

  return (
    <StoreContext.Provider value={{
      data,
      isLoading,
      addCliente,
      updateCliente,
      deleteCliente,
      addTienda,
      updateTienda,
      deleteTienda,
      addPedido,
      updatePedido,
      deletePedido,
      updateConfig,
      importData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

