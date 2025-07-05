/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, Pressable, View } from 'react-native'

import { getAll, forwardOrder, backwardOrder } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import timerSand from '../../../assets/timer-sand.jpg'
import chefHat from '../../../assets/chef-hat.jpg'
import truckDelivery from '../../../assets/truck-delivery.jpg'
import food from '../../../assets/food.jpg'

export default function OrdersScreen ({ navigation, route }) {
  const [orders, setOrders] = useState([]) // Es una lista de objetos de tipo Order
  const { loggedInUser } = useContext(AuthorizationContext)
  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders(null)
    }
  }, [loggedInUser, route]) // Cada vez que cambia la ruta con la que navegamos a esta pantalla se hace un fetch de los Orders, la ruta cambiará dependiendo del id del restaurante desde donde nos movemos

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getAll(route.params.id)
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurant orders. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderEmptyOrdersList = () => {
    return (
        <TextRegular textStyle={styles.emptyList}>There are no orders for this restaurant</TextRegular>
    )
  }
  // Funciones para cambiar los estados

  const backward = async (item) => {
    try {
      await backwardOrder(item.id)
      fetchOrders() // Para recargar la página
    } catch (error) {
      showMessage({
        message: `There was an error while trying to backward the order status. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const forward = async (item) => {
    try {
      await forwardOrder(item.id)
      fetchOrders() // Para recargar la página
    } catch (error) {
      showMessage({
        message: `There was an error while trying to forward the order status. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  // Funciones para tener en cuenta la restricción de que te deje revertir la acción antes de que pasen 5 min desde que la hiciste
  // OJO!!---> Es revertir la acción que se hizo, por lo que en verdad es darle al backward, es decir, tenemos 5 min para VOLVER AL ESTADO ANTERIOR DE DONDE ESTÁBAMOS
  const showPrevious = (status, reference) => {
    if (status === 'pending') { return false } else {
      const justNow = new Date(Date.now())
      const fiveMinutes = Date.parse(reference)
      return Math.abs(justNow - fiveMinutes) / 60000 <= 5 // Lo de entre 60000 es para pasar de milisegundos a minutos (dividir entre 1000 * 60)
    }
  }

  const showNext = (status) => {
    return status !== 'delivered'
  }

  const getCurrentStatusDate = (item) => {
    if (item.status === 'in process') { return item.startedAt } else if (item.status === 'sent') { return item.sentAt } else if (item.status === 'delivered') { return item.deliveredAt } else return null
  }
  const renderOrder = ({ item }) => {
    // Función auxiliar para renderizar el logo de los pedidos según su estado
    const orderLogo = item.status === 'pending' ? timerSand : item.status === 'in process' ? chefHat : item.status === 'delivered' ? food : truckDelivery
    return (
        <ImageCard
            imageUri={orderLogo}
            title={item.status}
        >
            <View style={{ paddingBottom: 70 }}>
            <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary, fontSize: 14 }}>Fecha de creación {item.createdAt}</TextSemiBold>
            <TextRegular>Total: {item.price} + {item.shippingCosts}</TextRegular>
            <TextRegular>Entrega en: {item.address}</TextRegular>
            <TextRegular>Usuario: {item.user.firstName} {item.user.lastName}</TextRegular>
            </View>
            <View style={styles.actionButtonsContainer}>
                { showPrevious(item.status, getCurrentStatusDate(item)) && ( // Si el status es pending no se puede ir para atrás, y si es delivered tampoco se puede hacer nada porque ya está entregado
                  <Pressable
                    onPress={() => backward(item) }
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

                {showNext(item.status) && (
                <Pressable
                    onPress={() => forward(item)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed
                          ? GlobalStyles.brandPrimaryTap
                          : GlobalStyles.brandPrimary
                      },
                      styles.actionButton
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
  return (
        <FlatList
            style={styles.container}
            data={orders}
            renderItem={renderOrder}
            keyExtractor={item => item.id.toString()}
            // ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyOrdersList}
        />
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
    width: '32%' // Disminuimos el ancho de los botones para que quepan los 3 por pantalla
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
