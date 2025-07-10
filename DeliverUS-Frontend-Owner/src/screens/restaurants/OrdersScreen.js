/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, Pressable, View } from 'react-native'

import { getOrders } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import timerSand from '../../../assets/timer-sand.jpg'
import chefHat from '../../../assets/chef-hat.jpg'
import food from '../../../assets/food.jpg'
import truckDelivery from '../../../assets/truck-delivery.jpg'
import { forward, backward } from '../../api/OrderEndpoints'

export default function OrdersScreen ({ navigation, route }) {
  const [orders, setOrders] = useState([]) // Una lista de objetos de tipo Order
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders() // Sin el await
    } else {
      setOrders(null)
    }
  }, [loggedInUser, route])

  // Funciones para avanzar o volver atrás respecto al estado
  const forwardStatus = async (item) => {
    // Siempre que se llame a un endpoint la función es async, hacemos try-catch y se llama a la función del endpoint con un await
    try {
      await forward(item.id) // Esto a hecho un patch del elemento, por lo que ahora tenemos que cargar todos los pedidos para que se muestre el resultado
      await fetchOrders() // El fetchOrders siempre lleva await porque es una función asíncrona excepto en el useEffect
    } catch (error) {
      showMessage({
        message: `There was an error while trying to forward status. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  const backwardStatus = async (item) => {
    // Siempre que se llame a un endpoint la función es async, hacemos try-catch y se llama a la función del endpoint con un await
    try {
      await backward(item.id) // Esto a hecho un patch del elemento, por lo que ahora tenemos que cargar todos los pedidos para que se muestre el resultado
      await fetchOrders() // El fetchOrders siempre lleva await porque es una función asíncrona excepto en el useEffect
    } catch (error) {
      showMessage({
        message: `There was an error while trying to backward status. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  // LAS ÓRDENES NO PODRÁN SER DEVUELTAS A SU ESTADO ANTERIOR UNA VEZ PASADOS 5 MINUTOS
  // Deshabilitamos el botón Previous cuando se detecte que han pasado 5 minutos
  const showPrevious = (status, reference) => {
    if (status === 'pending') { return false } else {
      const justNow = new Date(Date.now()) // OJO PONLE AL DATE.NOW LOS DOS PARÉNTESIS ()
      const fiveMinutesAgo = Date.parse(reference)
      return Math.abs(justNow - fiveMinutesAgo) / 60000 <= 5 // Si todavía no han pasado 5 min muestra True, si la resta es mayor a 5 min, muestra false
    }
  }
  const getCurrentStatusDate = (item) => {
    if (item.status === 'in process') { return item.startedAt } else if (item.status === 'sent') { return item.sentAt } else if (item.status === 'delivered') { return item.deliveredAt } else return null
  }
  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.status === 'pending' ? timerSand : item.status === 'in process' ? chefHat : item.status === 'sent' ? truckDelivery : food}
        title={item.status}
      >
        <View>
        <TextSemiBold numberOfLines={2} style={{ color: GlobalStyles.brandPrimary }}>Fecha de creación {item.createdAt}</TextSemiBold>
        <TextRegular>Total: {item.price} + {item.shippingCosts}€</TextRegular>
        <TextRegular>Entrega en: {item.address}</TextRegular>
        <TextRegular>Usuario: {item.user.firstName} {item.user.lastName}</TextRegular>
        </View>
        <View style={styles.actionButtonsContainer}>
          {/* Solución */}
        {showPrevious(item.status, getCurrentStatusDate(item)) && (
          <Pressable
            onPress={() => backwardStatus(item)}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandBlueTap
                  : GlobalStyles.brandBlue
              },
              styles.actionButton
            ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='page-previous' color={'white'} size={20}/>
            <TextRegular textStyle={styles.text}>
              Previous
            </TextRegular>
          </View>
        </Pressable>
        )}
      {item.status !== 'delivered' && (
          <Pressable
            onPress={() => forwardStatus(item)}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandSecondaryTap
                  : GlobalStyles.brandSecondary
              },
              styles.actionButton,
              { marginLeft: 'auto' } // Esto lo empuja a la derecha
            ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='page-next' color={'white'} size={20}/>
            <TextRegular textStyle={styles.text}>
              Next
            </TextRegular>
          </View>
        </Pressable>
      )}

        </View>
      </ImageCard>
    )
  }

  const renderEmptyOrdersList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No orders were retreived. Are you logged in?
      </TextRegular>
    )
  }

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getOrders(route.params.id) // A esta pantalla le pasamos como parámetro el id del restaurante
      setOrders(fetchedOrders)
    } catch (error) {
      console.log(error)
      showMessage({
        message: `There was an error while retrieving orders. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <>
    <FlatList
      style={styles.container}
      data={orders}
      renderItem={renderOrder}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={renderEmptyOrdersList}
    />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%' // 50% si hay dos botones
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    // position: 'absolute', // Esto hace que se superponga sobre el elemento anterior
    width: '90%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
