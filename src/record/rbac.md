# RBAC 模版

该套代码目前在生产上为 [SgridCloud](https://github.com/chelizichen/SgridCloud) 提供支持 *create by chelizichen*

## Golang 后台

### **数据库表实体**

````go
package rbac

import (
 "time"
)

// User Role Menu
type User struct {
 Id            int        `json:"id,omitempty"`        // id
 UserName      string     `json:"userName,omitempty"`  // 用户名
 Password      string     `json:"password,omitempty"`  // 密码
 TurthName     string     `json:"turthName,omitempty"` // 真实姓名
 CreateTime    *time.Time `gorm:"autoCreateTime" json:"createTime,omitempty"`
 LastLoginTime *time.Time `json:"lastLoginTime,omitempty"` // 上次登陆时间
}

type UserToRole struct {
 UserId int
 RoleId int
}

type UserRole struct {
 Id          int        `json:"id,omitempty"`
 Name        string     `json:"name,omitempty"`                             // 角色名
 Description string     `json:"description,omitempty"`                      // 角色名
 CreateTime  *time.Time `gorm:"autoCreateTime" json:"createTime,omitempty"` // 创建时间
}

type RoleToMenu struct {
 RoleId int `json:"roleId,omitempty"`
 MenuId int `json:"menuId,omitempty"`
}

type RoleMenu struct {
 Id        int    `json:"id,omitempty"`        // id
 Title     string `json:"title,omitempty"`     // 标题
 Path      string `json:"path,omitempty"`      // URL
 Name      string `json:"name,omitempty"`      // 名称
 Component string `json:"component,omitempty"` // 组建路径
 ParentId  int    `json:"parentId,omitempty"`  // 父级id
}
````

### 数据库方法

::: tip
使用 GORM 框架
:::

````go
package storage

import (
 c "Sgrid/src/configuration"
 "Sgrid/src/storage/dto"
 "Sgrid/src/storage/rbac"
 "Sgrid/src/utils"
 "fmt"
)

func GetUserList(req *dto.PageBasicReq) ([]rbac.User, int64) {
 var respList []rbac.User
 var count int64
 args := make([]interface{}, 10)
 where := "1 = 1"
 if req.Keyword != "" {
  where += " and user_name like ?"
  args = append(args, "%"+req.Keyword+"%")
 }
 c.GORM.
  Model(&rbac.User{}).
  Offset(req.Offset).
  Limit(req.Size).
  Count(&count).
  Where(
   where,
   utils.Removenullvalue(args)...,
  ).
  Find(&respList)
 return respList, count
}

func GetMenuList() []rbac.RoleMenu {
 var respList []rbac.RoleMenu
 c.GORM.
  Model(&rbac.RoleMenu{}).
  Find(&respList)
 return respList
}

func GetRoleList() []rbac.UserRole {
 var respList []rbac.UserRole
 c.GORM.
  Model(&rbac.UserRole{}).
  Find(&respList)

 return respList
}

// 通过角色ID 拿到菜单列表
func GetMenuListByRoleId(roleId int) []rbac.RoleToMenu {
 var respList []rbac.RoleToMenu
 c.GORM.
  Model(&rbac.RoleToMenu{}).
  Where("role_id = ?", roleId).
  Find(&respList)
 return respList
}

func DeleteMenu(id int) {
 c.GORM.Model(&rbac.RoleMenu{}).Delete(&rbac.RoleMenu{
  Id: id,
 })
 c.GORM.Model(&rbac.RoleToMenu{}).Delete(&rbac.RoleToMenu{
  MenuId: id,
 })
}

func DeleteRole(id int) {
 c.GORM.Model(&rbac.UserRole{}).Delete(&rbac.UserRole{
  Id: id,
 })
 c.GORM.Model(&rbac.UserToRole{}).Delete(&rbac.UserToRole{
  RoleId: id,
 })
}

func SetUserToRole(userId int, roleIds []int) {
 c.GORM.Delete(&rbac.UserToRole{}, "user_id = ?", userId)
 var userToRoles []*rbac.UserToRole
 for _, v := range roleIds {
  userToRoles = append(userToRoles, &rbac.UserToRole{
   UserId: userId,
   RoleId: v,
  })
 }
 c.GORM.Create(userToRoles)
}

func SetRoleToMenu(roleId int, menuIds []int) {
 c.GORM.Delete(&rbac.RoleToMenu{}, "role_id = ?", roleId)
 var userToRoles []*rbac.RoleToMenu
 for _, v := range menuIds {
  userToRoles = append(userToRoles, &rbac.RoleToMenu{
   RoleId: roleId,
   MenuId: v,
  })
 }
 c.GORM.Create(userToRoles)
}

func CreateRole(role *rbac.UserRole) {
 if role.Id == 0 {
  c.GORM.Create(role)
 } else {
  c.GORM.Model(&rbac.UserRole{}).
   Where("id = ?", role.Id).
   Updates(&rbac.UserRole{
    Name:        role.Name,
    Description: role.Description,
   })
 }
}

func CreateUser(user *rbac.User) {
 fmt.Println("user", user)
 if user.Id == 0 {
  user.Password = "e10adc3949ba59abbe56e057f20f883e" // 123456

  c.GORM.Create(user)
 } else {
  c.GORM.Model(&rbac.User{}).
   Where("id = ?", user.Id).
   Updates(&rbac.User{
    UserName:  user.UserName,
    TurthName: user.TurthName,
   })
 }
}

func CreateMenu(menu *rbac.RoleMenu) {
 if menu.Id == 0 {
  c.GORM.Create(menu)
 } else {
  c.GORM.Model(&rbac.RoleMenu{}).
   Where("id = ?", menu.Id).
   Updates(&rbac.RoleMenu{
    Title:     menu.Title,
    Path:      menu.Path,
    Name:      menu.Name,
    Component: menu.Component,
   })
 }
}

// relation
type RelationUserToRole struct {
 ID   uint   `gorm:"id" json:"id,omitempty"`
 Name string `gorm:"name" json:"name,omitempty"`
}

func GetUserToRoleRelation(id int) []RelationUserToRole {
 var findList []RelationUserToRole
 c.GORM.Debug().Raw(` 
 select gsr.id,gsr.name from grid_user_to_role gstr
 left join grid_user_role gsr on gstr.role_id = gsr.id
 left join grid_user gu on gu.id = gstr.user_id
 where gstr.user_id = ?
 `, id).Scan(&findList)
 return findList
}

func GetUserMenusByUserId(id int) []rbac.RoleMenu {
 var findList []rbac.RoleMenu
 c.GORM.Raw(` 
 select
 grm.*
from
 grid_role_to_menu grtm
left join grid_role_menu grm on
 grtm.menu_id = grm.id
where
 grtm.role_id  in (
 select
  gutr.role_id
 from
  grid_user_to_role gutr
 left join grid_user gu on
  gutr.user_id = gu.id
 where
  gu.id = ?
 )
 `, id).Scan(&findList)
 return findList
}
````

### http路由

````go
package service

import (
 handlers "Sgrid/src/http"
 "Sgrid/src/storage"
 "Sgrid/src/storage/dto"
 "Sgrid/src/storage/rbac"
 "fmt"
 "strconv"
 "strings"

 "github.com/gin-gonic/gin"
)

func SystemService(ctx *handlers.SgridServerCtx) {
 GROUP := ctx.Engine.Group(strings.ToLower(ctx.Name))
 // list get
 GROUP.POST("/system/user/get", getUser)
 GROUP.POST("/system/role/get", getRole)
 GROUP.POST("/system/menu/get", getMenu)
 // save
 GROUP.POST("/system/user/save", saveUser)
 GROUP.POST("/system/role/save", saveRole)
 GROUP.POST("/system/menu/save", saveMenu)

 // del
 GROUP.GET("/system/menu/del", delMenu)
 GROUP.GET("/system/role/del", delRole)

 // relation
 GROUP.POST("/system/setUserToRole", setUserToRole)
 GROUP.POST("/system/setRoleToMenu", setRoleToMenu)
 GROUP.GET("/system/getUserToRoleRelation", getUserToRoleRelation)
 GROUP.GET("/system/getMenuListByRoleId", getMenuListByRoleId)
}

func getUser(c *gin.Context) {
 var req *dto.PageBasicReq
 err := c.BindJSON(&req)
 if err != nil {
  fmt.Println("err", err.Error())
  handlers.AbortWithError(c, err.Error())
  return
 }
 u, i := storage.GetUserList(req)
 handlers.AbortWithSuccList(c, u, i)
}

func getRole(c *gin.Context) {
 u := storage.GetRoleList()
 handlers.AbortWithSucc(c, u)
}

func getMenu(c *gin.Context) {
 u := storage.GetMenuList()
 handlers.AbortWithSucc(c, u)
}

func saveUser(c *gin.Context) {
 var req *rbac.User
 err := c.BindJSON(&req)
 if err != nil {
  handlers.AbortWithError(c, err.Error())
  return
 }
 storage.CreateUser(req)
 handlers.AbortWithSucc(c, nil)
}

func saveRole(c *gin.Context) {
 var req *rbac.UserRole
 err := c.BindJSON(&req)
 if err != nil {
  fmt.Println("err", err.Error())
  handlers.AbortWithError(c, err.Error())
  return
 }
 storage.CreateRole(req)
 handlers.AbortWithSucc(c, nil)
}

func saveMenu(c *gin.Context) {
 var req *rbac.RoleMenu
 err := c.BindJSON(&req)
 if err != nil {
  handlers.AbortWithError(c, err.Error())
  return
 }
 storage.CreateMenu(req)
 handlers.AbortWithSucc(c, nil)
}

type setUserToRoleDto struct {
 UserId  int   `json:"userId"`
 RoleIds []int `json:"roleIds"`
}

func setUserToRole(c *gin.Context) {
 var req *setUserToRoleDto
 err := c.BindJSON(&req)
 if err != nil {
  handlers.AbortWithError(c, err.Error())
  return
 }
 storage.SetUserToRole(req.UserId, req.RoleIds)
 handlers.AbortWithSucc(c, nil)
}

type setRoleToMenuDto struct {
 RoleId  int   `json:"roleId"`
 MenuIds []int `json:"menuIds"`
}

func setRoleToMenu(c *gin.Context) {
 var req *setRoleToMenuDto
 err := c.BindJSON(&req)
 if err != nil {
  handlers.AbortWithError(c, err.Error())
  return
 }
 storage.SetRoleToMenu(req.RoleId, req.MenuIds)
 handlers.AbortWithSucc(c, nil)
}

func getUserToRoleRelation(c *gin.Context) {
 s, _ := strconv.Atoi(c.Query("id"))
 rutr := storage.GetUserToRoleRelation(s)
 handlers.AbortWithSucc(c, rutr)
}

func getMenuListByRoleId(c *gin.Context) {
 s, _ := strconv.Atoi(c.Query("id"))
 rutr := storage.GetMenuListByRoleId(s)
 handlers.AbortWithSucc(c, rutr)
}

func delMenu(c *gin.Context) {
 s, _ := strconv.Atoi(c.Query("id"))
 storage.DeleteMenu(s)
 handlers.AbortWithSucc(c, nil)
}

func delRole(c *gin.Context) {
 s, _ := strconv.Atoi(c.Query("id"))
 storage.DeleteRole(s)
 handlers.AbortWithSucc(c, nil)
}

````

## Vue 前端

### api.system.ts

**数据接口层**，用来封装请求，返回数据类型为 `BasicResp<T>`，其中 `T` 为接口返回的数据类型。

````ts

import type { BasicResp } from "@/dto/dto";
import request from "@/utils/request";

export function getUser(data: any) {
  return request({
    url: "/system/user/get",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}

export function getRole(data: any) {
  return request({
    url: "/system/role/get",
    method: "post",
    data,
  }) as unknown as BasicResp<any>
}

export function getMenu(data: any) {
  return request({
    url: "/system/menu/get",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}

export function saveUser(data: any) {
  return request({
    url: "/system/user/save",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}

export function saveRole(data: any) {
  return request({
    url: "/system/role/save",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}

export function saveMenu(data: any) {
  return request({
    url: "/system/menu/save",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}

export function delMenu(id:number) {
  return request({
    url: "/system/menu/del",
    method: "get",
    params:{id},
  }) as unknown as BasicResp<any>;
}

export function delRole(id:number) {
  return request({
    url: "/system/role/del",
    method: "get",
    params:{id},
  }) as unknown as BasicResp<any>;
}


export function setUserToRole(data: any) {
  return request({
    url: "/system/setUserToRole",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}

export function setRoleToMenu(data: any) {
  return request({
    url: "/system/setRoleToMenu",
    method: "post",
    data,
  }) as unknown as BasicResp<any>;
}


export function getUserToRoleRelation(id:number){
  return request({
    url: "/system/getUserToRoleRelation",
    method: "get",
    params:{id},
  }) as unknown as BasicResp<any>;
}

export function getMenuListByRoleId(id:number){
  return request({
    url: "/system/getMenuListByRoleId",
    method: "get",
    params:{id},
  }) as unknown as BasicResp<any>;
}
````

### 存储个人信息

使用 pinia 来存储个人信息

在 **router.addRoute(fatherRoute.name!, childRoute)** 中，fatherRouter.name 相当于 FatherRouterID，确保该值在已有路由中已存在，才可以进行正常的添加

````ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { reduceMenu, reduceMenuToRouter } from '@/utils/obj'
import type { RouteRecordRaw } from 'vue-router'
import router from '@/router'
import {uniqWith,isEqual} from 'lodash'
type userVo = {
  id: number
  password: string
  token: string
  userName: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<userVo>({
    id: 0,
    password: '',
    userName: '',
    token: ''
  })
  const menus = ref<RouteRecordRaw[]>([])
  function setUserInfo(userInfoDto: userVo) {
    userInfo.value = userInfoDto
  }
  async function setMenu(obj: any) {
    if(obj == null || obj == undefined){
      obj = []
    }
    obj = uniqWith(obj, isEqual)
    // obj = Array.from(new Set())
    const toRouters = reduceMenuToRouter(obj)
    menus.value = await toRouters
    menus.value.forEach((fatherRoute) => {
      router.addRoute('devops', fatherRoute)
      if (fatherRoute.children) {
        fatherRoute.children.forEach((childRoute) => {
          router.addRoute(fatherRoute.name!, childRoute)
        })
      }
    })
    console.log('getRoutes', router.getRoutes())
  }
  return { userInfo, setUserInfo, menus, setMenu }
})
````

**router**

````ts
const whileList = ['/login']
router.beforeEach(async (to, from, next) => {
  NProgress.start();
  const tkn = localGet(constants.TOKEN)
  const userStore = useUserStore()
  // 没登陆，但是在白名单内，直接跳转
  if (whileList.includes(to.path)) {
    next()
  }
  // 登陆了，但是store里面没有用户信息，需要重新获取用户信息
  else if (tkn &&  (!userStore.userInfo.userName && !userStore.userInfo.password && !userStore.userInfo.token)) {
    const data = await api.LoginByCache({
      name:'',
      password:''
    })
    if(!data.data){
      ElNotification.error("登陆过期，请重新登陆")
      return next({path:"/login"})
    }
    userStore.setUserInfo(data.data)
    const menus = await api.getUserMenusByUserId(data.data.id)
    await userStore.setMenu(menus.data)
    next({
      replace:true,
      ...to
    })
  } 
  // 登陆了，Store里也有对应的数据
  else if(tkn){
      next()
  }
  // 走登陆
  else{
    next({ path: '/login' })
  }
})

router.afterEach(() => {
  NProgress.done(); // 结束Progress
});
export default router
````

**obj.ts**代码主要提供数据转换的工具

````ts
import type { MenuVo, Tree } from '@/dto/dto'
import { loadView } from '@/permission'
import _ from 'lodash'
import type { RouteRecordRaw } from 'vue-router'
export function isEmptyObj(target: any): boolean {
  if(target == null || target == undefined){
    return true;
  }
  if (_.isObject(target)) {
    if (Object.keys(target).length == 0) {
      return true
    }
    return false
  }
  return true
}

export function reduceMenu(list: Array<MenuVo>): Tree[] {
  const menus: Tree[] = []
  // 拿到根节点
  list.forEach((e) => {
    if (e.parentId == 0 || !e.parentId) {
      menus.push({
        label: e.title,
        id: e.id
      })
    }
  })
  // 最多支持双层
  list.forEach((e) => {
    if (e.parentId || e.parentId != 0) {
      const item = menus.find((v) => v.id == e.parentId)
      if (!item) {
        return
      }
      if (!item.children) {
        item.children = []
      }
      item.children.push({
        label: e.title,
        id: e.id
      })
    }
  })
  return menus
}
              
export async function reduceMenuToRouter(list: Array<MenuVo>) {
    if(!list){
        list = []
    }
    const menus: Array<RouteRecordRaw> = []
  // 拿到根节点
  list.forEach(async (e) => {
    if (e.parentId == 0 || !e.parentId) {
        let component = null
        if(e.component){
            component = await loadView(`./views/${e.component}.vue`)
        }
      menus.push({
        title: e.title,
        id: e.id,
        path: e.path,
        name: e.name,
        icon: 'Grid',
        component:component,
      })
    }
  })
  // 最多支持双层
  list.forEach(async (e) => {
    if (e.parentId || e.parentId != 0) {
      const item = menus.find((v) => v.id == e.parentId)
      if (!item) {
        return
      }
      if (!item.children) {
        item.children = []
      }
      let component = null
      if(e.component){
          component = await loadView(`./views/${e.component}.vue`)
      }
      item.children.push({
        title: e.title,
        id: e.id,
        path: e.path,
        name: e.name,
        icon: 'Grid',
        component
      })
    }
  })
  return menus
}
````

### permission.ts

加载目录下的Vue文件

````ts
const views = import.meta.glob('./views/**/*.vue',{
    eager:true,
})
export const loadView = (view:string) => {
    return ()=>{
        return new Promise((resolve)=>{
            resolve(views[view])
        })
    }
}
````

### 菜单文件

菜单文件,提供对菜单的支持，可以自行改造为递归组件，这里只定义了两层，所以不多介绍

````vue
<template>
  <div>
    <el-container>
      <el-aside style="width: 200px; height: 100vh">
        <el-menu class="el-menu-vertical-demo" active-text-color="rgb(207, 15, 124)">
          <el-sub-menu v-for="(item, index) in menus" :index="String(index)" :key="index">
            <template #title>
              <el-icon><grid /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="(s_item, s_index) in item.children"
              :key="s_index"
              :index="index + '_' + s_index"
              @click="push(item, s_item)"
              >{{ s_item.title }}</el-menu-item
            >
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/stores/counter";
import { computed } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const userStore = useUserStore();
const menus = computed(() => {
  console.log("userStore.menus", userStore.menus);
  return userStore.menus;
});
const base_path = "/devops/";
function push(item: any, s_item: any) {
  const path = base_path + item.path + "/" + s_item.path;
  router.push(path);
  console.log(item, s_item);
}
</script>

<style scoped></style>
````