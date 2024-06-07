# SQL 相关

SQL 语句优化、索引优化、查询优化等，还包括ORM的使用，主从配置等。

## 索引优化

### Log日志从800ms优化到50ms

::: warning
索引不可盲目添加，由于内部会维护一个平衡树，在每次插入数据时，会维护索引，插入数据会变慢，所以添加过多的索引会导致性能下降。
:::

查询指定节点最近10条日志，数据量100万，未添加索引优化前800ms

**索引添加后，查询速度提升10倍以上**
**Input**

````sql
SELECT * from grid_stat_log gsl 
  where 
    gsl.grid_id  = 3 
    order by gsl.create_time  desc 
limit 0, 10;
````

添加索引

**Input**

````sql
alter table grid_stat_log add index idx_grid_id_create_time(grid_id, create_time);
````

**Output**

```sql
10 行已获取 - 63ms, 2024-06-07 14:57:12
```

## GORM最佳实践

### 定义实体

1. 优化GC，避免频繁创建对象，需要使用全局变量，减少GC次数。

````go

// 实体 需要满足Reset接口
type StorageMemory interface {
 Reset()
}

type O_Dresser struct {
 Id         uint          `gorm:"column:id" json:"id,omitempty"`
 Name       string        `gorm:"column:name" json:"name,omitempty"`
 IdCard     string        `gorm:"column:id_card" json:"idCard,omitempty"`
 Phone      string        `gorm:"column:phone" json:"phone,omitempty"`
 Level      string        `gorm:"column:level" json:"level,omitempty"`
 PhotoUrl   string        `gorm:"column:photo_url" json:"photoUrl,omitempty"`
 CreateTime *time.Time    `gorm:"column:create_time" json:"createTime,omitempty"`
 lock       *sync.RWMutex `gorm:"-" json:"-"`
}

var DresserMapper = new(O_Dresser)

func (o *O_Dresser) Reset() {
 o.Id = 0
 o.Name = ""
 o.IdCard = ""
 o.Phone = ""
 o.Level = ""
 o.PhotoUrl = ""
 o.CreateTime = nil
}

func (o *O_Dresser) GetLock() *sync.RWMutex {
 return o.lock
}


````

2. 将方法定义在实体中，避免方法调用时，需要传递实体对象。

````go
func (o *O_Dresser) QueryList(pag Pagination) ([]*O_Dresser, int64) {
 pag.Page = pag.Page - 1
 var list []*O_Dresser
 var count int64
 storage.S_db.
  Model(o).
  Select("id", "name", "id_card", "phone", "level", "photo_url", "create_time").
  Where("name like %?%", pag.Keyword).
  Count(&count).
  Offset(pag.Page * pag.Size).
  Limit(pag.Size).
  Find(&list)
 return list, count
}

func (o *O_Dresser) GetOne(id uint) *O_Dresser {
 var oldObj = new(O_Dresser)
 storage.S_db.Model(o).Where("id = ?", id).Find(&oldObj)
 return oldObj
}

func (o *O_Dresser) Upsert(dto *O_Dresser) {
 if dto.Id != 0 {
  storage.S_db.Model(o).Where("id = ?", dto.Id).Updates(dto)
 } else {
  storage.S_db.Model(o).Create(dto)
 }
}

````
