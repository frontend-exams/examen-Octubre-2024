/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, Pressable, View } from 'react-native'

import { getOrders } from '../../api/RestaurantEndpoints'
import { forward, backward } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import timerSand from '../../../assets/timer-sand.jpg'
import truckDelivery from '../../../assets/truck-delivery.jpg'
import chefHat from '../../../assets/chef-hat.jpg'
import food from '../../../assets/food.jpg'

export default function OrdersScreen ({ navigation, route }) {
  const [orders, setOrders] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders(null)
    }
  }, [loggedInUser, route])

  // Funciones para los cambios de estado
  const forwardStatus = async (item) => {
    try { // EN FUNCIONES ASÍNCRONAS SIEMPRE PONER TRY-CATCH
      // El endpoint básicamente consiste en hacer un patch así que no tenemos por qué asignar ninguna varible
      await forward(item.id) // Pedido actualizado
      // Ahora tenemos que actualizar la pantalla entera para que se muestre el cambio
      await fetchOrders()
    } catch (error) {
      showMessage({
        message: `There was an error while trying to forward order status . ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const backwardStatus = async (item) => {
    try { // EN FUNCIONES ASÍNCRONAS SIEMPRE PONER TRY-CATCH
      // El endpoint básicamente consiste en hacer un patch así que no tenemos por qué asignar ninguna varible
      await backward(item.id) // Pedido actualizado
      // Ahora tenemos que actualizar la pantalla entera para que se muestre el cambio
      await fetchOrders()
    } catch (error) {
      showMessage({
        message: `There was an error while trying to backward order status . ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  // Creamos una función para mostrar el botón previous y que se deje de mostrar pasados los 5 min
  const showPrevious = (item, reference) => {
    if (item.status === 'pending') { return false }
    const currentTime = new Date()
    const referenceTime = new Date(reference)
    return Math.abs(currentTime - referenceTime) <= 5 * 60 * 1000 // Pasamos los minutos a milisegundos
  }
  const getStatusTime = (item) => {
    if (item.status === 'in process') {
      return item.startedAt
    } else if (item.status === 'sent') {
      return item.sentAt
    } else if (item.status === 'delivered') {
      return item.deliveredAt
    } else {
      return null
    }
  }
  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.status === 'pending' ? timerSand : item.status === 'sent' ? truckDelivery : item.status === 'in process' ? chefHat : food}
        title={item.status}
      >
        <TextSemiBold style={{ color: GlobalStyles.brandPrimary }}>Fecha de creación: {item.createdAt}</TextSemiBold>
        <TextRegular>Total: {item.price} + {item.shippingCosts}€</TextRegular>
        <TextRegular>Entrega en: {item.address}</TextRegular>
        <TextRegular>Usuario: {item.user.firstName} {item.user.lastName}</TextRegular>

        <View style={styles.actionButtonsContainer}>
        {showPrevious(item, getStatusTime(item)) && (
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
                  ? GlobalStyles.brandPrimaryTap
                  : GlobalStyles.brandPrimary
              },
              styles.actionButton,
              {
                marginLeft: 'auto'
              }
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
      const fetchedOrders = await getOrders(route.params.id)
      setOrders(fetchedOrders)
    } catch (error) {
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
    width: '50%' // Para que quepan los 2 botones por pantalla ponemos el width al 50%
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
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
