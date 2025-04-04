import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../supabase';

interface Producto {
  id: string;
  nombre_producto: string;
  categoria: string;
  impacto_ambiental: string;
  sugerencia_sostenible: string;
  frecuencia: number;
  cantidad: number;
}

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  producto: Producto | null;
  onSave: (updatedProduct: Producto) => void;
}

const EditModal: React.FC<EditModalProps> = ({ visible, onClose, producto, onSave }) => {
  const [editedProduct, setEditedProduct] = useState<Producto | null>(producto);

  useEffect(() => {
    setEditedProduct(producto);
  }, [producto]);

  if (!editedProduct) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.container}>
        <View style={modalStyles.content}>
          <Text style={modalStyles.title}>Editar Producto</Text>
          
          <TextInput
            style={modalStyles.input}
            value={editedProduct.nombre_producto}
            onChangeText={(text) => setEditedProduct({...editedProduct, nombre_producto: text})}
            placeholder="Nombre del producto"
          />
          
          <TextInput
            style={modalStyles.input}
            value={editedProduct.categoria}
            onChangeText={(text) => setEditedProduct({...editedProduct, categoria: text})}
            placeholder="Categoría"
          />
          
          <TextInput
            style={modalStyles.input}
            value={editedProduct.impacto_ambiental}
            onChangeText={(text) => setEditedProduct({...editedProduct, impacto_ambiental: text})}
            placeholder="Impacto ambiental"
          />
          
          <TextInput
            style={modalStyles.input}
            value={editedProduct.sugerencia_sostenible}
            onChangeText={(text) => setEditedProduct({...editedProduct, sugerencia_sostenible: text})}
            placeholder="Sugerencia sostenible"
          />
          
          <TextInput
            style={modalStyles.input}
            value={editedProduct.cantidad.toString()}
            onChangeText={(text) => setEditedProduct({...editedProduct, cantidad: parseInt(text) || 0})}
            placeholder="Cantidad"
            keyboardType="numeric"
          />

          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton]} onPress={onClose}>
              <Text style={modalStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[modalStyles.button, modalStyles.saveButton]} 
              onPress={() => {
                onSave(editedProduct);
                onClose();
              }}>
              <Text style={modalStyles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [listaCompras, setListaCompras] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarFiltrados, setMostrarFiltrados] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const { width } = useWindowDimensions();

  // Efecto para debounce de la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Efecto para filtrar productos automáticamente
  useEffect(() => {
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      const resultados = listaCompras.filter((producto) =>
        producto.nombre_producto.toLowerCase().includes(query) || 
        producto.categoria.toLowerCase().includes(query)
      );
      setProductosFiltrados(resultados);
      setMostrarFiltrados(true);
    } else {
      setProductosFiltrados(listaCompras);
    }
  }, [debouncedQuery, listaCompras]);

  const cargarHistorial = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('eco_lista')
      .select('*')
      .order('fecha_compra', { ascending: false });
    
    setCargando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo cargar el historial. Inténtalo de nuevo.');
      console.error('Error al cargar historial:', error);
    } else {
      setListaCompras(data);
      setProductosFiltrados(data);
      
      const categoriasUnicas = Array.from(new Set(data.map((item) => item.categoria)));
      setCategoriasDisponibles(categoriasUnicas);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const productosPorCategoria = (categoria: string) => {
    if (categoria === '') {
      setProductosFiltrados(listaCompras);
    } else {
      setProductosFiltrados(listaCompras.filter((producto) => producto.categoria === categoria));
    }
    setMostrarFiltrados(true);
    setSearchQuery('');
  };

  const productosFrecuentes = () => {
    const productosAgrupados = listaCompras.reduce((acc: any[], producto) => {
      const index = acc.findIndex(item => item.nombre_producto === producto.nombre_producto);
      if (index === -1) {
        acc.push({ ...producto, cantidadTotal: producto.cantidad });
      } else {
        acc[index].cantidadTotal += producto.cantidad;
      }
      return acc;
    }, []);

    const productosOrdenados = productosAgrupados.sort((a, b) => b.cantidadTotal - a.cantidadTotal);
    setProductosFiltrados(productosOrdenados);
    setMostrarFiltrados(true);
    setSearchQuery('');
  };

  const eliminarProducto = async (id: string) => {
    console.log('Iniciando eliminación para ID:', id);
    
    try {
      const { error } = await supabase
        .from('eco_lista')
        .delete()
        .eq('id', id);
  
      console.log('Respuesta de Supabase:', { error });
  
      if (error) throw error;
  
      await cargarHistorial();
      Alert.alert('Éxito', 'Producto eliminado');
    } catch (error) {
      console.error('Error completo:', error);
      Alert.alert('Error', 'Falló la eliminación');
    }
  };

  const actualizarProducto = async (updatedProduct: Producto) => {
    setCargando(true);
    try {
      const { error } = await supabase
        .from('eco_lista')
        .update({
          nombre_producto: updatedProduct.nombre_producto,
          categoria: updatedProduct.categoria,
          impacto_ambiental: updatedProduct.impacto_ambiental,
          sugerencia_sostenible: updatedProduct.sugerencia_sostenible,
          cantidad: updatedProduct.cantidad
        })
        .eq('id', updatedProduct.id);

      if (error) throw error;

      await cargarHistorial();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setCargando(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={[styles.title, { fontSize: width * 0.06 }]}>¡Bienvenido a EcoLista!</Text>
      <Text style={[styles.subtitle, { fontSize: width * 0.04 }]}>Descubre productos sostenibles</Text>

      <TextInput
        style={[styles.searchBar, { width: width * 0.85 }]}
        placeholder="Buscar productos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.categoriesContainer}>
        <TouchableOpacity onPress={() => productosPorCategoria('Limpieza')} style={styles.categoryButton} activeOpacity={0.7}>
          <Text style={styles.categoryButtonText}>Limpieza</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => productosPorCategoria('Granos')} style={styles.categoryButton} activeOpacity={0.7}>
          <Text style={styles.categoryButtonText}>Granos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => productosPorCategoria('')} style={styles.categoryButton} activeOpacity={0.7}>
          <Text style={styles.categoryButtonText}>Todos los productos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={productosFrecuentes} style={styles.categoryButton} activeOpacity={0.7}>
          <Text style={styles.categoryButtonText}>Frecuentes</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.filterButton} onPress={() => setMostrarFiltrados(!mostrarFiltrados)} activeOpacity={0.7}>
        <Text style={styles.filterButtonText}>{mostrarFiltrados ? 'Ocultar' : 'Mostrar'} Historial</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator size="large" color="#43a047" />
      ) : (
        mostrarFiltrados && (
          <View style={styles.listContainer}>
            <Text style={styles.productCount}>Mostrando {productosFiltrados.length} productos</Text>
            <FlatList
              data={productosFiltrados}
              keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
              renderItem={({ item }) => (
                <View style={[styles.productItem, { width: width * 0.9 }]}>
                  <Text style={styles.productName}>{item.nombre_producto}</Text>
                  <Text>Categoría: {item.categoria}</Text>
                  <Text>Impacto Ambiental: {item.impacto_ambiental}</Text>
                  <Text>Sugerencia: {item.sugerencia_sostenible}</Text>
                  <Text>Cantidad: {item.cantidad}</Text>
                  
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        setEditingProduct(item);
                        setIsEditModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => eliminarProducto(item.id)}
                    >
                      <Text style={styles.actionButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              nestedScrollEnabled={true}
            />
          </View>
        )
      )}

      <EditModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        producto={editingProduct}
        onSave={actualizarProducto}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#e8f5e9' },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#2e7d32' },
  subtitle: { textAlign: 'center', color: '#388e3c', marginBottom: 20 },
  searchBar: { 
    borderWidth: 1, 
    padding: 10, 
    borderRadius: 5, 
    borderColor: '#81c784', 
    backgroundColor: '#fff', 
    marginBottom: 20,
    fontSize: 16
  },
  categoriesContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    marginBottom: 20 
  },
  categoryButton: { 
    backgroundColor: '#4caf50', 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    margin: 5, 
    flexBasis: '48%' 
  },
  categoryButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  filterButton: { 
    backgroundColor: '#43a047', 
    padding: 10, 
    borderRadius: 5, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  filterButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  listContainer: {
    flex: 1,
    width: '100%'
  },
  productCount: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#2e7d32',
    fontWeight: 'bold'
  },
  productItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#66bb6a', 
    backgroundColor: '#c8e6c9',
    borderRadius: 8,
    marginVertical: 5
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#2e7d32'
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#e53935',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#81c784',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#43a047',
  },
  cancelButton: {
    backgroundColor: '#e53935',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});