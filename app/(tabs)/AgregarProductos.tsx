import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, useWindowDimensions, FlatList, Modal, ScrollView, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../../supabase';

// Ignorar advertencia específica de VirtualizedList
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

interface Producto {
  id: string;
  nombre_producto: string;
  categoria: string;
  impacto_ambiental: string;
  sugerencia_sostenible: string;
  frecuencia: number;
  cantidad: number;
}

export default function App() {
  const [producto, setProducto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [impactoAmbiental, setImpactoAmbiental] = useState('');
  const [sugerencia, setSugerencia] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAgregarCategoria, setModalAgregarCategoria] = useState(false);
  const [nuevoCategoria, setNuevoCategoria] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase.from('eco_lista').select('categoria');
        
        if (error) throw error;

        const categoriasUnicas = Array.from(new Set(data.map(item => item.categoria).filter(Boolean)));
        setCategoriasDisponibles(categoriasUnicas);
      } catch (error) {
        console.error("Error al obtener categorías:", error);
        Alert.alert("Error", "No se pudieron cargar las categorías");
      } finally {
        setCargando(false);
      }
    };

    fetchCategorias();
  }, []);

  const agregarProducto = async () => {
    if (!producto.trim() || !categoria.trim() || !impactoAmbiental.trim() || !sugerencia.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    setCargando(true);
    try {
      const { data: productosExistentes, error: fetchError } = await supabase
        .from('eco_lista')
        .select('*')
        .eq('nombre_producto', producto)
        .eq('categoria', categoria);

      if (fetchError) throw fetchError;

      if (productosExistentes && productosExistentes.length > 0) {
        // Producto existe, actualizar cantidad
        const productoExistente = productosExistentes[0];
        const { error: updateError } = await supabase
          .from('eco_lista')
          .update({ cantidad: productoExistente.cantidad + cantidad })
          .eq('id', productoExistente.id);

        if (updateError) throw updateError;

        Alert.alert('Éxito', 'Cantidad actualizada del producto existente');
      } else {
        // Producto no existe, crear nuevo
        const nuevoProducto = {
          nombre_lista: 'Lista Personalizada',
          nombre_producto: producto,
          impacto_ambiental: impactoAmbiental,
          sugerencia_sostenible: sugerencia,
          categoria,
          cantidad,
          frecuencia: 0,
        };

        const { error: insertError } = await supabase
          .from('eco_lista')
          .insert([nuevoProducto]);

        if (insertError) throw insertError;

        Alert.alert('Éxito', 'Producto agregado correctamente');
      }

      // Limpiar formulario
      setProducto('');
      setCategoria('');
      setImpactoAmbiental('');
      setSugerencia('');
      setCantidad(1);
    } catch (error) {
      console.error('Error al agregar producto:', error);
      Alert.alert('Error', 'No se pudo agregar el producto. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const agregarCategoria = async () => {
    if (!nuevoCategoria.trim()) {
      Alert.alert('Error', 'El nombre de la categoría no puede estar vacío.');
      return;
    }
  
    try {
      setCargando(true);
      
      // Verificar si la categoría ya existe
      const { data: categoriasExistentes, error: fetchError } = await supabase
        .from('eco_lista')
        .select('categoria')
        .eq('categoria', nuevoCategoria);
  
      if (fetchError) throw fetchError;
  
      if (categoriasExistentes && categoriasExistentes.length > 0) {
        Alert.alert('Error', 'Esta categoría ya existe.');
        return;
      }
  
      // Agregar categoría
      const { error: insertError } = await supabase
        .from('eco_lista')
        .insert([{ 
          categoria: nuevoCategoria,
          nombre_lista: 'Lista Personalizada',
          nombre_producto: '',
          impacto_ambiental: '',
          sugerencia_sostenible: '',
          cantidad: 0,
          frecuencia: 0
        }]);
  
      if (insertError) throw insertError;
  
      // Actualizar lista de categorías
      setCategoriasDisponibles(prev => [...prev, nuevoCategoria]);
      setNuevoCategoria('');
      setModalAgregarCategoria(false);
      Alert.alert('Éxito', 'Categoría agregada correctamente');
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      Alert.alert('Error', 'No se pudo agregar la categoría. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const eliminarCategoria = async (categoriaAEliminar: string) => {
    try {
      const { error } = await supabase
        .from('eco_lista')
        .delete()
        .eq('categoria', categoriaAEliminar);

      if (error) throw error;

      setCategoriasDisponibles(prev => prev.filter(c => c !== categoriaAEliminar));
      Alert.alert('Éxito', 'Categoría eliminada');
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      Alert.alert('Error', 'No se pudo eliminar la categoría. Inténtalo de nuevo.');
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={[styles.title, { fontSize: width * 0.06 }]}>Agregar Productos</Text>

      {cargando ? (
        <ActivityIndicator size="large" color="#43a047" />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Producto" 
              value={producto} 
              onChangeText={setProducto} 
            />

            <TouchableOpacity
              style={styles.input}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={categoria ? styles.selectedCategoryText : styles.placeholderText}>
                {categoria || "Seleccionar Categoría"}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { maxHeight: height * 0.7 }]}>
                  <FlatList
                    data={categoriasDisponibles}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.categoryItemContainer}>
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => {
                            setCategoria(item);
                            setModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>{item}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => eliminarCategoria(item)}
                        >
                          <Text style={styles.deleteButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No hay categorías disponibles</Text>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                  />

                  <TouchableOpacity
                    style={styles.modalAddCategoryButton}
                    onPress={() => {
                      setModalVisible(false);
                      setModalAgregarCategoria(true);
                    }}
                  >
                    <Text style={styles.modalAddCategoryButtonText}>Agregar Nueva Categoría</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal
              visible={modalAgregarCategoria}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setModalAgregarCategoria(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva Categoría"
                    value={nuevoCategoria}
                    onChangeText={setNuevoCategoria}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={agregarCategoria}
                    disabled={cargando}
                  >
                    <Text style={styles.addButtonText}>
                      {cargando ? 'Agregando...' : 'Agregar Categoría'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalAgregarCategoria(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <TextInput
              style={styles.input}
              placeholder="Impacto Ambiental"
              value={impactoAmbiental}
              onChangeText={setImpactoAmbiental}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Sugerencia Sostenible"
              value={sugerencia}
              onChangeText={setSugerencia}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Cantidad"
              value={cantidad.toString()}
              onChangeText={(text) => setCantidad(Number(text) || 1)}
              keyboardType="numeric"
            />

            <TouchableOpacity 
              style={styles.addButton} 
              onPress={agregarProducto} 
              activeOpacity={0.7}
              disabled={cargando}
            >
              <Text style={styles.addButtonText}>
                {cargando ? 'Agregando...' : 'Agregar Producto'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: '#e8f5e9' 
  },
  scrollContainer: {
    flexGrow: 1,
  },
  title: { 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 5, 
    color: '#2e7d32' 
  },
  inputContainer: { 
    backgroundColor: '#ffffff', 
    padding: 15, 
    borderRadius: 5, 
    elevation: 2 
  },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    borderRadius: 5, 
    borderColor: '#4caf50', 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  addButton: { 
    backgroundColor: '#2e7d32', 
    padding: 15, 
    borderRadius: 5, 
    alignItems: 'center' 
  },
  addButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContainer: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10, 
    width: '80%',
    maxHeight: '70%'
  },
  modalItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalItemText: { 
    fontSize: 16 
  },
  deleteButton: { 
    position: 'absolute', 
    right: 10, 
    top: 15, 
    padding: 5 
  },
  deleteButtonText: { 
    color: 'red', 
    fontSize: 14 
  },
  modalAddCategoryButton: { 
    marginTop: 10, 
    alignItems: 'center', 
    backgroundColor: '#4caf50', 
    padding: 10, 
    borderRadius: 5 
  },
  modalAddCategoryButtonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  modalCloseButton: { 
    marginTop: 20, 
    alignItems: 'center', 
    padding: 10 
  },
  modalCloseButtonText: { 
    color: '#2e7d32', 
    fontWeight: 'bold' 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#888', 
    padding: 20 
  },
  selectedCategoryText: {
    color: '#388e3c',
    fontWeight: 'bold',
  },
  placeholderText: {
    color: '#8e8e8e',
  },
  categoryItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});