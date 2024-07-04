<template>
  <div class="container mt-5 text-monospace">
    <h2>Upload Dokumen</h2>
    <form @submit.prevent="submitDocument">
      <div class="mb-3">
        <label for="documentInput" class="form-label">Pilih Dokumen</label>
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
export default {
  name: "LogoSave",
  data() {
    return {
      selectedFile: null,
      items: [],
      modalShow: false,
      modalMessage: "",
    };
  },
  methods: {
    async PostDelete(id, index) {
      try {
        await axios.delete(`http://localhost:3003/delete/${id}`);
        // Hapus item dari array setelah berhasil menghapus data di server
        this.items.splice(index, 1);
        this.$bvModal.msgBoxOk("PDF file has been uploaded", {
          title: "Confirmation",
          size: "sm",
          buttonSize: "sm",
          okVariant: "success",
          headerClass: "p-2 border-bottom-0",
          footerClass: "p-2 border-top-0",
          centered: true,
        });
      } catch (error) {
        console.error(error);
        // Handle error response
      }
    },
    // Setelah mengambil data dari database (misalnya menggunakan Sequelize)
    async getDatabaseData() {
      try {
        // Ganti dengan kode yang mengambil data dari tabel yang sesuai
        const response = await axios.get("http://localhost:3003/fetch-all");
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
          .post("http://localhost:3003/upload", formData)
          .then((response) => {
            console.log(response.data);
            this.$refs.myTable.refresh();
            setTimeout(() => {
              // Simulate getting a response from the server after upload

              this.$bvModal.msgBoxOk("PDF file has been uploaded", {
                title: "Confirmation",
                size: "sm",
                buttonSize: "sm",
                okVariant: "success",
                headerClass: "p-2 border-bottom-0",
                footerClass: "p-2 border-top-0",
                centered: true,
              });
            }, 1000); // 1 second delay for simulation
          })
          .catch((error) => {
            console.error(error);
            // Handle error response
          });
      } else {
        this.$bvModal.msgBoxOk("Please select a PDF file", {
          title: "Attention",
          size: "sm",
          buttonSize: "sm",
          okVariant: "danger",
          headerClass: "p-2 border-bottom-0",
          footerClass: "p-2 border-top-0",
          centered: true,
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
