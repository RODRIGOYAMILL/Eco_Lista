import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export default function AcercaDeLaPagina() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Acerca de EcoLista</Text>
        <Text style={styles.subtitle}>Tu asistente de compras sostenibles</Text>
        
        <Text style={styles.paragraph}>
          EcoLista es una aplicación diseñada para ayudarte a tomar decisiones de compra más sostenibles. 
          Nuestra misión es fomentar hábitos de consumo responsables proporcionando información sobre 
          el impacto ambiental de los productos y sugiriendo alternativas ecológicas.
        </Text>

        <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>🔎 Búsqueda de productos:</Text> Encuentra productos fácilmente ingresando su nombre o filtrando por categoría.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>➕ Agregar productos:</Text> Puedes registrar productos en tu lista, incluyendo detalles sobre su impacto ambiental y opciones más sostenibles.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>📜 Historial de compras:</Text> Accede a tu historial para ver qué productos compras con más frecuencia y optimizar tus elecciones.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>🌱 Sugerencias sostenibles:</Text> Recibe recomendaciones de productos ecológicos para reducir tu huella de carbono.
        </Text>

        <Text style={styles.sectionTitle}>Beneficios de usar EcoLista</Text>
        <Text style={styles.paragraph}>
          ✅ <Text style={styles.bold}>Fomenta un estilo de vida más ecológico:</Text> Te ayuda a hacer compras responsables y reducir el impacto ambiental.
        </Text>
        <Text style={styles.paragraph}>
          ✅ <Text style={styles.bold}>Organización eficiente:</Text> Mantén un registro de tus productos y accede a tus compras frecuentes con facilidad.
        </Text>
        <Text style={styles.paragraph}>
          ✅ <Text style={styles.bold}>Información valiosa:</Text> Obtén datos sobre el impacto ambiental de los productos y descubre alternativas más sostenibles.
        </Text>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  scrollContainer: { flexGrow: 1, padding: 20, alignItems: 'center', width: '100%', maxWidth: width * 0.9 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1b5e20', marginBottom: 10, fontFamily: 'serif' },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#2e7d32', marginBottom: 20, fontStyle: 'italic' },
  paragraph: { fontSize: 16, textAlign: 'center', color: '#4e4e4e', marginBottom: 15, lineHeight: 24, paddingHorizontal: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginBottom: 10, textAlign: 'center' },
  bold: { fontWeight: 'bold', color: '#1b5e20' }
});