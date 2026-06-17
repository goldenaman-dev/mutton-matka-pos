import { useEffect, useState } from 'react'
import BackButton from './backButton'
import '../assets/menuMangement.css'

function MenuManagement(): React.JSX.Element {
  const [items, setItems] = useState<any[]>([])

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('veg')

  const [variants, setVariants] = useState([
    {
      size: 'half',
      price: ''
    },
    {
      size: 'full',
      price: ''
    }
  ])

  async function loadItems() {
    try {
      const data = await window.api.getItems()
      setItems(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function addItem() {
    if (!name.trim()) {
      alert('Please enter item name')
      return
    }

    try {
      await window.api.saveItem({
        name,
        category,
        type,
        variants: variants
          .filter(
            (v) =>
              v.size.trim() &&
              v.price !== ''
          )
          .map((v) => ({
            size: v.size,
            price: Number(v.price)
          }))
      })

      setName('')
      setCategory('')
      setType('veg')

      setVariants([
        {
          size: 'half',
          price: ''
        },
        {
          size: 'full',
          price: ''
        }
      ])

      loadItems()
    } catch (error) {
      console.error(error)
      alert('Failed to save item')
    }
  }

  const handleJsonUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const result =
        await window.api.importMenu(json)

      if (result.success) {
        alert(
          `Imported ${result.count} items`
        )
        loadItems()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error(error)
      alert('Invalid JSON')
    }
  }

  return (
    <div className="menu-management">
      <BackButton />

      <h1>Menu Management</h1>

      <div className="section-card">
        <h2>Add Item</h2>

        <div className="form-grid">
          <input
            className="form-input"
            placeholder="Item Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            className="form-input"
            placeholder="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          />

          <select
            className="form-input"
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >
            <option value="veg">
              Veg
            </option>
            <option value="non-veg">
              Non Veg
            </option>
          </select>
        </div>

        <h4>Variants</h4>

        {variants.map(
          (variant, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 10
              }}
            >
              <input
                className="form-input"
                placeholder="Size"
                value={variant.size}
                onChange={(e) => {
                  const updated = [
                    ...variants
                  ]
                  updated[index].size =
                    e.target.value
                  setVariants(updated)
                }}
              />

              <input
                className="form-input"
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={(e) => {
                  const updated = [
                    ...variants
                  ]
                  updated[index].price =
                    e.target.value
                  setVariants(updated)
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setVariants(
                    variants.filter(
                      (_, i) =>
                        i !== index
                    )
                  )
                }}
              >
                ❌
              </button>
            </div>
          )
        )}

        <button
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              {
                size: '',
                price: ''
              }
            ])
          }
        >
          + Add Variant
        </button>

        <br />
        <br />

        <button
          className="primary-btn"
          onClick={addItem}
        >
          Add Item
        </button>
      </div>

      <div className="section-card">
        <h2>Import Menu JSON</h2>

        <label className="primary-btn">
          📂 Upload Menu JSON

          <input
            type="file"
            accept=".json"
            style={{
              display: 'none'
            }}
            onChange={handleJsonUpload}
          />
        </label>
      </div>

      <div className="section-card table-section">
        <h2>
          Current Menu ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="empty-state">
            No menu items found
          </div>
        ) : (
          <div className="table-container">
            <table className="menu-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  {/* <th>Type</th> */}
                  <th>Variants</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <EditableRow
                    key={item.id}
                    item={item}
                    onSaved={loadItems}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EditableRow({
  item,
  onSaved
}: {
  item: any
  onSaved: () => void
}) {
  const data = item.item_data || {}

  const [name, setName] = useState(
    data.name || ''
  )

  const [category, setCategory] =
    useState(data.category || '')

  const [type, setType] = useState(
    data.type || 'veg'
  )

  const [variants, setVariants] =
    useState(
      data.variants || [
        {
          size: 'regular',
          price: 0
        }
      ]
    )

  async function save() {
    try {
      await window.api.updateItem({
        id: item.id,
        name,
        category,
        type,
        variants
      })

      onSaved()
    } catch (error) {
      console.error(error)
      alert('Failed to update item')
    }
  }

  async function deleteItem() {
    if (
      !confirm(
        `Delete ${name}?`
      )
    )
      return

    try {
      await window.api.deleteItem(
        item.id
      )

      onSaved()
    } catch (error) {
      console.error(error)
      alert('Failed to delete item')
    }
  }

  return (
    <tr>
      <td>
        <input
          className="table-input"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />
      </td>

      <td>
        <input
          className="table-input"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
        />
      </td>

      {/* <td>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
        >
          <option value="veg">
            Veg
          </option>

          <option value="non-veg">
            Non Veg
          </option>
        </select>
      </td> */}

      <td
        style={{
          minWidth: '350px'
        }}
      >
        {variants.map(
          (
            variant: any,
            index: number
          ) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 6
              }}
            >
              <input
                className="table-input"
                placeholder="Size"
                value={
                  variant.size
                }
                onChange={(e) => {
                  const updated =
                    [
                      ...variants
                    ]

                  updated[
                    index
                  ].size =
                    e.target.value

                  setVariants(
                    updated
                  )
                }}
              />

              <input
                className="table-input"
                type="number"
                placeholder="Price"
                value={
                  variant.price
                }
                onChange={(e) => {
                  const updated =
                    [
                      ...variants
                    ]

                  updated[
                    index
                  ].price =
                    Number(
                      e.target.value
                    )

                  setVariants(
                    updated
                  )
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setVariants(
                    variants.filter(
                      (
                        _: any,
                        i: number
                      ) =>
                        i !==
                        index
                    )
                  )
                }}
              >
                ❌
              </button>
            </div>
          )
        )}

        <button
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              {
                size: '',
                price: 0
              }
            ])
          }
        >
          + Variant
        </button>
      </td>

      <td>
        <button
          className="save-btn"
          onClick={save}
        >
          Save
        </button>

        <button
          style={{
            marginLeft: 10
          }}
          onClick={deleteItem}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export default MenuManagement