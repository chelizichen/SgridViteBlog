---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "SgridCloud"
  text: "开发文档"
  tagline: 通过提供一套简单易用的服务管理平台来更好的实现自动化和运维
  actions:
    - theme: brand
      text: SgridCloud
      link: /src/sgrid/index.md
    - theme: alt
      text: DevRecords
      link: /src/record/index.md
    - theme: alt
      text: Food
      link: /src/food/index.md
    - theme: alt
      text: Trade
      link: /src/trade/index.md
features:
  - title: 配置中心
    details: 采用数据库存储配置信息，使用环境变量注入的方式对应用进行配置
  - title: 版本控制
    details: 服务包的版本会被存储到数据库中，方便版本回滚
  - title: 运维管理
    details: 支持动态扩缩容，节点管理，支持服务监控，日志管理
  - title: 心跳检测
    details: 通过配置心跳检测，可以实时获取服务状态，并触发告警
---

