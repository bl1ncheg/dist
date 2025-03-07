<template>
  <div>
    <div class="controls">
      <button @click="resetSort">Сбросить сортировку</button>
    </div>

    <div ref="list" class="list">
      <div v-for="item in sortedItems" :key="item.id" class="item">
        <input 
          type="checkbox" 
          v-model="checkedItems"
          :value="item.id"
          class="checkbox"
          @change="saveChecked"
        >
        <div class="content">{{ item.title }}</div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import Sortable from 'sortablejs';

export default {
  data() {
    return {
      items: [],
      page: 1,
      totalItems: 0,
      loading: false,
      error: null,
      checkedItems: JSON.parse(localStorage.getItem('checkedItems')) || [],
      sortOrder: JSON.parse(localStorage.getItem('sortOrder')) || []
    }
  },
  computed: {
    sortedItems() {
      if (this.sortOrder.length === 0) return this.items;
      const orderMap = new Map(this.sortOrder.map((id, index) => [id, index]));
      return [...this.items].sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
    }
  },
  async created() {
    await this.loadItems();
    window.addEventListener('scroll', this.handleScroll);
  },
  mounted() {
    this.initSortable();
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
    if (this.sortable) this.sortable.destroy();
  },
  methods: {
    initSortable() {
      this.sortable = Sortable.create(this.$refs.list, {
        animation: 150,
        handle: '.item',
        ghostClass: 'ghost',
        chosenClass: 'chosen',
        onEnd: (evt) => {
          const newOrder = [...this.sortedItems];
          const [movedItem] = newOrder.splice(evt.oldIndex, 1);
          newOrder.splice(evt.newIndex, 0, movedItem);
          this.sortOrder = newOrder.map(item => item.id);
          this.saveSort();
        }
      });
    },
    async loadItems() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/items`, {
          params: {
            page: this.page,
            limit: 20
          }
        });

        this.totalItems = response.data.total;
        const newItems = response.data.items.filter(item => 
          !this.items.some(existing => existing.id === item.id)
        );

        this.items = [...this.items, ...newItems];
        this.restoreSort();
        this.page++;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    handleScroll() {
      const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100 && 
          !this.loading && 
          this.items.length < this.totalItems) {
        this.loadItems();
      }
    },
    saveChecked() {
      localStorage.setItem('checkedItems', JSON.stringify(this.checkedItems));
    },
    saveSort() {
      localStorage.setItem('sortOrder', JSON.stringify(this.sortOrder));
    },
    restoreSort() {
      if (this.sortOrder.length > 0 && this.items.length > 0) {
        const orderMap = new Map(this.sortOrder.map((id, index) => [id, index]));
        this.items.sort((a, b) => (orderMap.get(a.id) || Infinity) - (orderMap.get(b.id) || Infinity));
      }
    },
    resetSort() {
      localStorage.removeItem('sortOrder');
      this.sortOrder = [];
      this.page = 1;
      this.items = [];
      this.loadItems();
    }
  }
}
</script>

<style scoped>
.list {
  max-width: 600px;
  margin: 0 auto;
}

.item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin: 5px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: move;
  user-select: none;
  transition: transform 0.2s;
}

.checkbox {
  margin-right: 15px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.controls {
  margin-bottom: 20px;
  text-align: center;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.chosen {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>