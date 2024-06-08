import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "SgridCloud",
  description: "blog for sgridcloud",
  base:"/docs/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'SgridCloud', link: '/src/sgrid/index.md' },
      { text: 'DevRecords', link: '/src/record/index.md' },
    ],

    sidebar:{
      "/src/sgrid/":[
        {
          text: 'Deploy',
          items: [
            { text: 'Document', link: '/src/sgrid/' },
            { text: 'Api Examples', link: '/src/sgrid/api-examples.md' },
          ]
        }
      ],
      "/src/record/":[
        {
          text: 'Dev Records',
          items: [
            { text: 'Intro', link: '/src/record/index.md' },
            { text: 'Records', link: '/src/record/markdown-examples.md' },
            { text: 'Java', link: '/src/record/java.md' },
            { text: 'Golang', link: '/src/record/golang.md' },
            { text: 'JavaScript', link: '/src/record/javascript.md' },
            { text: 'Mysql', link: '/src/record/mysql.md' },
            { text: 'Rbac', link: '/src/record/rbac.md' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/chelizichen/SgridCloud' }
    ]
  }
})
