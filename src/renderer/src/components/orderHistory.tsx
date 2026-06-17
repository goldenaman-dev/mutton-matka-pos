import {
  useEffect,
  useState
} from 'react'
import BackButton from './backButton'
import '../assets/orderHistory.css'



function OrderHistory() {
  const [orders, setOrders] =
    useState<any[]>([])

  const [page, setPage] =
    useState(1)

  const [total, setTotal] =
    useState(0)

  const [search, setSearch] =
    useState('')

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .split('T')[0]
    )

  const limit = 20

  useEffect(() => {
    loadOrders()
  }, [page, search, date])

  async function loadOrders() {
    try {
      const result =
        await window.api.getOrderHistory({
          page,
          limit,
          search,
          date
        })

      setOrders(result.orders)
      setTotal(result.total)
    } catch (err) {
      console.error(err)
    }
  }

  const totalPages = Math.ceil(
    total / limit
  )

  return (
    <div className="order-history-page">
      <BackButton />

      <div className="history-header">
        <h1>Order History</h1>

        <div className="filters">
          <input
            type="text"
            placeholder="Search Order ID or Item"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />
        </div>
      </div>

      <div className="orders-table">
        <div className="table-head">
          <div>ID</div>
          <div>Order No</div>
          <div>Date</div>
          <div>Total</div>
          <div>Items</div>
        </div>

        {orders.map((order) => {
          let items = []

          try {
            items = JSON.parse(
              order.order_data
            )
          } catch {}

          return (
            <div
              key={order.id}
              className="table-row"
            >
              <div>{order.id}</div>

              <div>
                {
                  order.order_number
                }
              </div>

              <div>
                {new Date(
                  order.created_at
                ).toLocaleString()}
              </div>

              <div>
                ₹
                {
                  order.total_amount
                }
              </div>

              <div>
                {items
                  .slice(0, 3)
                  .map(
                    (
                      item: any
                    ) =>
                      item.name
                  )
                  .join(', ')}

                {items.length >
                  3 &&
                  '...'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() =>
            setPage(
              page - 1
            )
          }
        >
          Previous
        </button>

        <span>
          Page {page} /{' '}
          {totalPages || 1}
        </span>

        <button
          disabled={
            page >= totalPages
          }
          onClick={() =>
            setPage(
              page + 1
            )
          }
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default OrderHistory