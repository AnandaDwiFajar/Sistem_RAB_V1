import React, { useState } from 'react'
import {
  ClipboardList,
  PlusCircle,
  Loader2,
  AlertTriangle,
  Edit3,
  Trash2,
  Save,
  X,
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Asumsi hook dan modal ini ada di path yang benar
import { useUserData } from '../hooks/useUserData'
import ManageWorkItemCategoriesModal from '../components/modals/ManageWorkItemCategoriesModal'

/**
 * Komponen wrapper untuk setiap baris tabel agar bisa di-sort.
 * Menggunakan hook useSortable dari @dnd-kit.
 * @param {object} props - Props yang diterima komponen.
 * @return {JSX.Element}
 */
const SortableCategoryRow = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 'auto', // Tampilkan di atas item lain saat di-drag
  }

  // Meneruskan semua props ke komponen anak (baris tabel)
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors ${
        isDragging ? 'bg-blue-50 shadow-lg' : 'hover:bg-gray-50'
      }`}
    >
      {/* Pass a custom drag handle */}
      <td
        {...attributes}
        {...listeners}
        className="p-4 text-center cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={18} className="text-gray-400 mx-auto" />
      </td>
      {props.children}
    </tr>
  )
}

const ManageWorkItemCategoriesView = () => {
  // Asumsi useUserData mengembalikan state dan fungsi-fungsi ini
  const {
    userWorkItemCategories,
    setUserWorkItemCategories,
    handleAddNewWorkItemCategory,
    handleDeleteWorkItemCategory,
    handleUpdateWorkItemCategory,
    handleUpdateCategoriesOrder,
    newCategoryName,
    setNewCategoryName,
    isLoading,
    error,
  } = useUserData()

  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingName, setEditingName] = useState('')

  // --- PERUBAHAN: Konfigurasi sensor untuk @dnd-kit ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  /**
   * Memulai mode edit untuk sebuah kategori.
   * @param {object} category - Objek kategori yang akan diedit.
   */
  const handleStartEdit = (category) => {
    setEditingCategory(category)
    setEditingName(category.category_name)
  }

  /**
   * Membatalkan mode edit.
   */
  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditingName('')
  }

  /**
   * Menyimpan perubahan nama kategori setelah diedit.
   */
  const handleSaveEdit = async () => {
    if (!editingCategory || !editingName.trim()) return
    await handleUpdateWorkItemCategory(editingCategory.id, editingName.trim())
    handleCancelEdit()
  }

  /**
   * Menangani penghapusan kategori.
   * @param {object} category - Objek kategori yang akan dihapus.
   */
  const handleDelete = async (category) => {
    await handleDeleteWorkItemCategory(category)
  }

  /**
   * Fungsi yang dipanggil setelah pengguna selesai melakukan drag-and-drop.
   * @param {object} event - Objek event dari @dnd-kit.
   */
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = userWorkItemCategories.findIndex(
        (cat) => cat.id === active.id,
      )
      const newIndex = userWorkItemCategories.findIndex(
        (cat) => cat.id === over.id,
      )

      const newOrder = arrayMove(userWorkItemCategories, oldIndex, newIndex)

      // 1. Update state di frontend
      setUserWorkItemCategories(newOrder)

      // 2. Panggil API untuk menyimpan urutan baru
      handleUpdateCategoriesOrder(newOrder)
    }
  }

  /**
   * Komponen untuk menampilkan tabel kategori dengan fungsionalitas drag-and-drop.
   * @return {JSX.Element} Komponen tabel kategori.
   */
  const CategoriesTable = () => (
    <div className="overflow-x-auto bg-white border border-industrial-gray-light rounded-lg shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-industrial-gray-light">
          <tr>
            <th className="p-4 w-12 text-center">
              <span className="sr-only">Urutkan</span>
            </th>
            <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider">
              Nama Kategori
            </th>
            <th className="p-4 text-xs font-semibold text-industrial-gray-dark uppercase tracking-wider text-right">
              Aksi
            </th>
          </tr>
        </thead>
        {/* --- PERUBAHAN: Menggunakan DndContext dan SortableContext --- */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={userWorkItemCategories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {userWorkItemCategories.map((category) => (
                <SortableCategoryRow key={category.id} category={category}>
                  {/* Konten baris dipindahkan ke dalam children */}
                  {editingCategory && editingCategory.id === category.id ? (
                    <>
                      <td className="p-3">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          className="w-full px-2 py-1 bg-white border border-industrial-accent-dark rounded-md text-industrial-dark focus:outline-none focus:ring-2 focus:ring-industrial-accent"
                          autoFocus
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:text-green-800" title="Simpan">
                            <Save size={18} />
                          </button>
                          <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:text-gray-700" title="Batal">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-medium text-industrial-dark">
                        {category.category_name}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleStartEdit(category)} className="p-1.5 text-industrial-gray-dark hover:text-industrial-accent-dark" title="Edit">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(category)} className="p-1.5 text-red-500 hover:text-red-700" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </SortableCategoryRow>
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  )

  /**
   * Komponen untuk ditampilkan ketika tidak ada data kategori.
   * @return {JSX.Element} Komponen placeholder saat tidak ada data.
   */
  const NoDataDisplay = () => (
    <div className="text-center py-16 px-6 border-2 border-dashed border-industrial-gray-light rounded-lg">
      <ClipboardList size={48} className="mx-auto text-industrial-gray" />
      <h3 className="mt-4 text-xl font-semibold text-industrial-dark">
        Belum Ada Kategori
      </h3>
      <p className="mt-2 text-industrial-gray-dark">
        Tambahkan kategori baru untuk komponen pekerjaan.
      </p>
      <div className="mt-6">
        <button onClick={() => setShowModal(true)} className="flex items-center mx-auto px-4 py-2 bg-industrial-accent text-white font-semibold rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors">
          <PlusCircle size={18} className="mr-2" /> Tambah Kategori Baru
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <div className=" flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-industrial-dark">
            Kelola Kategori Pekerjaan
          </h1>
          {userWorkItemCategories.length > 0 && (
            <button onClick={() => setShowModal(true)} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-industrial-accent rounded-md hover:bg-industrial-accent-dark shadow-sm transition-colors">
              <PlusCircle size={18} className="mr-2" /> Tambah Kategori
            </button>
          )}
        </div>
        <p className="pb-2 text-industrial-gray-dark">
            Urutan kategori akan mempengaruhi tampilan di RAB. Urutan pertama akan muncul di bagian atas.
          </p>
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-industrial-gray-dark">
            <Loader2 className="animate-spin mr-2" />
            <span>Memuat data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 text-red-600 bg-red-100 rounded-lg">
            <AlertTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        ) : userWorkItemCategories.length === 0 ? (
          <NoDataDisplay />
        ) : (
          <CategoriesTable />
        )}

        <ManageWorkItemCategoriesModal
          showManageCategoriesModal={showModal}
          setShowManageCategoriesModal={setShowModal}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          handleAddNewWorkItemCategory={handleAddNewWorkItemCategory}
        />
      </div>
    </div>
  )
}

export default ManageWorkItemCategoriesView;
