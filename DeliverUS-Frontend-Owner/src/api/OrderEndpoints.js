import { get, post, put, destroy, patch } from './helpers/ApiRequestsHelper'
function getAll (restaurantId) {
  return get(`/restaurants/${restaurantId}/orders`)
}
function forwardOrder (orderId) {
  return patch(`/orders/${orderId}/forward`)
}

function backwardOrder (orderId) {
  return patch(`/orders/${orderId}/backward`)
}
export { getAll, forwardOrder, backwardOrder }
