import { useEffect, useMemo, useState } from 'react'
import BackButton from './backButton'
import '../assets/newOrder.css'
import { useNavigate } from 'react-router-dom'

interface OrderItem {
  itemId: number
  name: string
  variant: string
  price: number
  qty: number
}

function NewOrder() {

   const navigate = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderNumber, setOrderNumber] = useState(
  `ORD-${Date.now()}`
)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      const data = await window.api.getItems()
      setItems(data || [])
    } catch (err) {
      console.error('Failed loading items', err)
    }
  }

  function addItem(
    item: any,
    variant: { name: string; price: number }
  ) {
    const existing = orderItems.find(
      (x) =>
        x.itemId === item.id &&
        x.variant === variant.name
    )

    if (existing) {
      setOrderItems((prev) =>
        prev.map((x) =>
          x.itemId === item.id &&
          x.variant === variant.name
            ? { ...x, qty: x.qty + 1 }
            : x
        )
      )
      return
    }

    setOrderItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        variant: variant.name,
        price: variant.price,
        qty: 1
      }
    ])
  }

  function updateQty(index: number, change: number) {
    setOrderItems((prev) =>
      prev
        .map((item, i) =>
          i === index
            ? {
                ...item,
                qty: item.qty + change
              }
            : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  const filteredItems = items.filter((item) =>
    (item.name || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const total = useMemo(() => {
    return orderItems.reduce(
      (sum, item) =>
        sum + item.price * item.qty,
      0
    )
  }, [orderItems])

 async function printBill() {
  if (orderItems.length === 0) {
    alert('No items in order')
    return
  }

  const orderNo = orderNumber

  try {
    await window.api.createOrder({
      orderNumber: orderNo,
      items: orderItems,
      total
    })

    const billItems = orderItems
      .map(
        (item) => `
${item.name}
${item.variant && item.variant !== 'Regular' ? `(${item.variant})` : ''}
${item.qty} x ₹${item.price} = ₹${item.qty * item.price}
--------------------------------
`
      )
      .join('')

    const html = `
    <html>
  <head>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        font-family: monospace;
        font-size: 12px;
      }

      .receipt {
        width: 100%;
        max-width: 300px; /* safe for all thermal printers */
        padding: 8px;
        box-sizing: border-box;
      }

      .center {
        text-align: center;
      }

      .right {
        text-align: right;
      }

      .title {
        font-size: 16px;
        font-weight: bold;
      }

      .small {
        font-size: 13px;
        font-weight: bold;
      }

      .line {
        border-top: 1px dashed black;
        margin: 6px 0;
      }

      pre {
        white-space: pre-wrap;
        font-size: 12px;
        margin: 0;
      }

      .row {
        display: flex;
        justify-content: space-between;
      }

      .footer {
        text-align: center;
        margin-top: 8px;
      }
    </style>
  </head>

  <body>
    <div class="receipt">

      <!-- HEADER -->
      <div class="center title">
        ----Mutton Matka---
      </div>

      <div class="center small">
        Taste of Tradition
      </div>

      <div class="center">
        kathal more, ranchi-834001
      </div>

      <div class="line"></div>

      <!-- ORDER INFO -->
      <div>
        Order No: ${orderNo}
        <br/>
        Date: ${new Date().toLocaleString()}
      </div>

      <div class="line"></div>

      <!-- ITEMS -->
      <pre>${billItems}</pre>

      <div class="line"></div>

      <!-- TOTAL -->
      <div class="right">
        <b>Total: ₹${total}</b>
      </div>

      <div class="line"></div>

      <!-- FOOTER -->
      <div class="footer">
        Thank You, Visit Again!
      </div>

    </div>
  </body>
</html>
    `

    await window.api.printBill(html)

    // optional reset
    // setOrderItems([])
    // setOrderNumber(orderNumber + 1)

  } catch (err) {
    console.error('Failed to save order', err)
    alert('Failed to save order')
  }
}

async function printKOT() {
  const orderNo = orderNumber

  const kotItems = orderItems
    .map(
      (item) => `
${item.name}
${item.variant !== 'Regular' ? `(${item.variant})` : ''}
Qty : ${item.qty}
--------------------------------
`
    )
    .join('')

  const html = `
  <html>
  <head>
    <style>
      body {
        font-family: monospace;
        width: 58mm;
        padding: 5px;
        font-size: 14px;
      }

      .center {
        text-align: center;
      }

      .title {
        font-size: 22px;
        font-weight: bold;
      }

      .line {
        border-top: 1px dashed black;
        margin: 6px 0;
      }

      pre {
        white-space: pre-wrap;
        font-size: 15px;
        margin: 0;
      }

      @page {
        margin: 0;
        size: 58mm auto;
      }
    </style>
  </head>

  <body>

    <div class="center title">
      KOT
    </div>

    <div class="line"></div>

    <div>
      Order No : ${orderNo}
      <br />
      ${new Date().toLocaleString()}
    </div>

    <div class="line"></div>

    <pre>${kotItems}</pre>

    <div class="line"></div>

    <div class="center">
      Kitchen Copy
    </div>

  </body>
  </html>
  `

  await window.api.printBill(html)
  navigate('/dashboard')
}

  return (
    <div className="new-order-page">
      <div className="menu-section">
        <BackButton />

        <div className="search-container">
          <input
            type="text"
            placeholder="Search Item..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="item-grid">
          {filteredItems.map((item) => {
            let itemData: any = {}

            try {
              itemData =
                typeof item.item_data ===
                'string'
                  ? JSON.parse(item.item_data)
                  : item.item_data || {}
            } catch (err) {
              console.error(
                'Invalid JSON',
                item
              )
            }

            return (
              <div
                key={item.id}
                className="item-card"
              >
                <div className="item-header">
                  <h3>{item.name}</h3>

                  <span
                    className={`food-badge ${
                      itemData.type ||
                      'veg'
                    }`}
                  >
                    {itemData.type ||
                      'veg'}
                  </span>
                </div>

                <div className="variants">
                  {/* Variant Items */}
                  {itemData.variants?.length >
                  0 ? (
                    itemData.variants.map(
                      (
                        variant: any,
                        index: number
                      ) => (
                        <button
                          key={index}
                          className="variant-btn"
                          onClick={() =>
                            addItem(
                              item,
                              {
                                name:
                                  variant.size,
                                price:
                                  variant.price
                              }
                            )
                          }
                        >
                          <div>
                            {
                              variant.size
                            }
                          </div>
                          <div>
                            ₹
                            {
                              variant.price
                            }
                          </div>
                        </button>
                      )
                    )
                  ) : itemData.price ? (
                    /* Single Price Item */
                    <button
                      className="variant-btn"
                      onClick={() =>
                        addItem(
                          item,
                          {
                            name:
                              'Regular',
                            price:
                              itemData.price
                          }
                        )
                      }
                    >
                      ₹{itemData.price}
                    </button>
                  ) : itemData.pricing ? (
                    /* Handi Pricing */
                    <>
                      {itemData.pricing
                        .price_250_grams && (
                        <button
                          className="variant-btn"
                          onClick={() =>
                            addItem(
                              item,
                              {
                                name:
                                  '250gm',
                                price:
                                  itemData
                                    .pricing
                                    .price_250_grams
                              }
                            )
                          }
                        >
                          250gm
                          <br />
                          ₹
                          {
                            itemData
                              .pricing
                              .price_250_grams
                          }
                        </button>
                      )}

                      {itemData.pricing
                        .price_half_kg && (
                        <button
                          className="variant-btn"
                          onClick={() =>
                            addItem(
                              item,
                              {
                                name:
                                  '500gm',
                                price:
                                  itemData
                                    .pricing
                                    .price_half_kg
                              }
                            )
                          }
                        >
                          500gm
                          <br />
                          ₹
                          {
                            itemData
                              .pricing
                              .price_half_kg
                          }
                        </button>
                      )}

                      {itemData.pricing
                        .price_per_kg && (
                        <button
                          className="variant-btn"
                          onClick={() =>
                            addItem(
                              item,
                              {
                                name:
                                  '1kg',
                                price:
                                  itemData
                                    .pricing
                                    .price_per_kg
                              }
                            )
                          }
                        >
                          1kg
                          <br />
                          ₹
                          {
                            itemData
                              .pricing
                              .price_per_kg
                          }
                        </button>
                      )}

                      {itemData.pricing
                        .per_handi && (
                        <button
                          className="variant-btn"
                          onClick={() =>
                            addItem(
                              item,
                              {
                                name:
                                  'Handi',
                                price:
                                  itemData
                                    .pricing
                                    .per_handi
                              }
                            )
                          }
                        >
                          Handi
                          <br />
                          ₹
                          {
                            itemData
                              .pricing
                              .per_handi
                          }
                        </button>
                      )}
                    </>
                  ) : (
                    <div>
                      No Price
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bill-section">
        <h2>Current Order</h2>

        <div className="order-list">
          {orderItems.map(
            (item, index) => (
              <div
                key={index}
                className="order-item"
              >
                <div>
                  <strong>
                    {item.name}
                  </strong>
                  <div>
                    {
                      item.variant
                    }
                  </div>
                </div>

                <div className="qty-box">
                  <button
                    onClick={() =>
                      updateQty(
                        index,
                        -1
                      )
                    }
                  >
                    -
                  </button>

                  <span>
                    {item.qty}
                  </span>

                  <button
                    onClick={() =>
                      updateQty(
                        index,
                        1
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <div>
                  ₹
                  {item.price *
                    item.qty}
                </div>
              </div>
            )
          )}
        </div>

        <div className="bill-footer">
          <h1>₹{total}</h1>

          <button
            className="print-btn"
            onClick={printBill}
          >
            Print Bill
          </button>

          <button
            className="kot-btn"
            onClick={printKOT}
          >
            Print KOT
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewOrder