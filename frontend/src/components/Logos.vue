<template>
  <div class="container mt-5 text-monospace">
    <h2>Upload Dokumen</h2>
    <form @submit.prevent="submitDocument">
      <div class="mb-3">
        <label class="form-label">Pilih Dokumen</label>
        <input
          type="file"
          class="form-control p-1"
          id="documentInput"
          @change="handleFileUpload"
          accept=".pdf"
        />
      </div>
      <b-button
        hover
        v-b-modal.modal-center-footer-sm
        @click="modalShow = !modalShow"
        type="submit"
        class="btn rounded-5 text-dark"
        id="btn"
        >Upload</b-button
      >
    </form>
    <div class="mt-2 border" id="table">
      <b-table ref="myTable" hover :items="items" :fields="fields">
        <template #cell(status)="data">
          <b-icon-trash
            icon="trash-fill"
            variant="danger"
            @click="deleteItem(data.item)"
          ></b-icon-trash>
          <span
            :class="{
              'text-danger': data.item.Status === 1,
              'text-primary': data.item.Status === 0,
            }"
          >
            {{ data.item.Status === 1 ? "Expired" : "Not Expired" }}
          </span>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { BIconTrash } from "bootstrap-vue";
import Swal from "sweetalert2";
export default {
  components: {
    BIconTrash,
  },
  name: "LogoSave",
  data() {
    return {
      selectedFile: null,
      items: [],
      fields: [],
      modalShow: false,
      modalMessage: "",
    };
  },
  methods: {
    // Contoh menggunakan Vue.js sweetalert2 untuk konfirmasi

    deleteItem(item) {
      console.log("Item to delete:", item); // Tambahkan logging di sini
      // Gunakan sweetalert2 untuk konfirmasi
      Swal.fire({
        title: "Apakah Anda yakin?",
        text: "Anda tidak akan dapat mengembalikan ini!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, hapus itu!",
      }).then((result) => {
        if (result.isConfirmed) {
          axios
            .delete("http://localhost:3003/data/delete-file/${item.id}")
            .then((response) => {
              // Hapus item dari array items
              this.items = this.items.filter((i) => i.id !== item.id);
              // Tampilkan pesan sukses dengan data response
              Swal.fire(
                "Terhapus!",
                `Item Anda telah dihapus. Pesan: ${response.data}`,
                "success"
              );
            })
            .catch((error) => {
              console.error("Error deleting item:", error);
              // Tampilkan pesan error dengan data response
              Swal.fire(
                "Gagal!",
                `Gagal menghapus item: ${error.response.data}`,
                "error"
              );
            });
        }
      });
    },

    // Setelah mengambil data dari database (misalnya menggunakan Sequelize)
    async getDatabaseData() {
      try {
        // Ganti dengan kode yang mengambil data dari tabel yang sesuai
        const response = await axios.get("http://localhost:3003/data/fetch-all");
        this.items = response.data.documents.map((doc) => ({
          ...doc,
        }));
      } catch (error) {
        console.error(error);
        // Handle error response
      }
    },

    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    submitDocument() {
      if (this.selectedFile && this.selectedFile.type === "application/pdf") {
        // Simulate file upload and response
        let formData = new FormData();
        formData.append("file", this.selectedFile);
        // Simulate a delay for the upload process
        axios
          .post("http://localhost:3003/data/upload", formData)
          .then((response) => {
            console.log(response.data);
            this.getDatabaseData();
            this.$refs.myTable.refresh();
            setTimeout(() => {
              Swal.fire({
                position: "center",
                icon: "success",
                title: "File anda telah di upload",
                showConfirmButton: false,
                timer: 1500,
              });
            });
          })
          .catch((error) => {
            console.error(error);
            // Handle error response
          });
      } else {
        Swal.fire({
          position: "center",
          icon: "info",
          title: "silakan upload file anda terlebih dahulu",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    },
    checkAndDeleteExpiredDocuments() {
      const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
      this.items = this.items.filter((item) => {
        if (item.expired_date < currentDate) {
          // Here you would also call your backend service to delete the document from the database
          return false; // This will remove the item from the items array
        }
        return true;
      });
    },
  },
  mounted() {
    console.log("Items:", this.items); // Tambahkan logging di sini
    this.getDatabaseData();
    // Call the checkAndDeleteExpiredDocuments method every day at midnight
    const interval = 15 * 1000; // 24 hours in milliseconds
    setInterval(this.checkAndDeleteExpiredDocuments, interval);
  },
  created() {
    this.getDatabaseData();
  },
};
</script>

<style scoped>
.custom-hover:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}
#btn {
  background-color: white;
}
#table {
  background-color: white;
  font-weight: 500;
}
</style>
