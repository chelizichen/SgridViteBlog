# Java

SpringBoot  系列 Sgrid For SpringBoot,与一些日常问题

## Sgird For SpringBoot

为了使 **Sgrid** 能够良好的适配 **SpringBoot** 并且拥有多节点组的运行，需要进行额外的配置
首先创建 **framework** 目录，在 **SpringBoot Application** 目录下

并且创建三个文件,其中 **SgridConfInterface** 为接口，里面数据库的配置可以不用做。但是得有，配置后 **SpringBoot** 会自动加载。

- framework
  - EnableSgridServer.java
  - Server.java
  - ServletContainer.java
  - SgridConf.java

**EnableSgridServer.java**

````java
package com.sgrid.app.framework;
import org.springframework.context.annotation.Import;
import java.lang.annotation.Target;
import java.lang.annotation.Retention;
import java.lang.annotation.ElementType;
import java.lang.annotation.RetentionPolicy;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Import(SgridConf.class)
public @interface EnableSgridServer {
    
}
````

**Server.java**

````java
package com.sgrid.app.framework;

public class Server {
    public Integer port;
    public String name;
    public String host;
    public String protocol;
    public String language;

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public String toString() {
        return "Server [port=" + port + ", name=" + name + ", host=" + host + ", protocol=" + protocol + ", language="
                + language + "]";
    }
}

````

**SgridConf.java**

````java
package com.sgrid.app.framework;

import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.HashMap;

@Component
public class SgridConf {

    private boolean isConfigured = false; // 标志位，表示配置是否已被设置
    private final static String SGRID_TARGET_PORT = "SGRID_TARGET_PORT";
    private final static String SGRID_DEV_CONF = "sgrid.yml";
    private final static String SGRID_CONFIG = "SGRID_CONFIG";
    private final static String SGRID_PROCESS_INDEX = "SGRID_PROCESS_INDEX";

    public Server server;
    public HashMap<String, String> config = new HashMap<>();

    @PostConstruct
    public void init() {
        if (!isConfigured) {
            isConfigured = true; // 设置标志位，表示配置已完成
            // 这一步必须要执行
            this.SetSgridConf();
            // 这一步选执行，只是提供参考设置的样例代码 ！
            this.SetDBProperty(config.get("mysql-addr"), config.get("mysql-username"), config.get("mysql-password"));
        }
    }

    @Bean
    public ServletContainer servletContainer() {
        System.out.println("[Sgrid-Java] [info] init servletContainer ");
        return new ServletContainer();
    }

    @Override
    public String toString() {
        return "SgridConf [server=" + server + ", config=" + config + ", isConfigured=" + isConfigured + "]";
    }

    private SgridConf loadDevConf(Resource resource) throws IOException {
        Yaml yaml = new Yaml();
        return yaml.loadAs(resource.getInputStream(), SgridConf.class);
    }

    private SgridConf loadProdConf(String yamlContent) throws IOException {
        Yaml yaml = new Yaml();
        return yaml.loadAs(yamlContent, SgridConf.class);
    }

    public void SetDBProperty(String url, String username, String password) {
        System.setProperty("spring.datasource.url", url);
        System.setProperty("spring.datasource.username", username);
        System.setProperty("spring.datasource.password", password);
    }

    public void SetSgridConf() {
        try {
            String sgridProdConf = System.getenv(SGRID_CONFIG);
            String sgridTargetPort = System.getenv(SGRID_TARGET_PORT);
            if (sgridProdConf == null || sgridProdConf.isEmpty()) { // 测试环境下
                Resource resource = new ClassPathResource(SGRID_DEV_CONF);
                SgridConf sgridConf = loadDevConf(resource);
                setServer(sgridConf.server);
                setConfig(sgridConf.config);
            } else {    // 生产环境下 有配置 需要将 PORT 塞到 server.config中
                SgridConf sgridConf = loadProdConf(sgridProdConf);
                setServer(sgridConf.server);
                setConfig(sgridConf.config);
                server.setPort(Integer.valueOf(sgridTargetPort));
            }
        } catch (Exception e) {
            System.err.println("[Sgrid-Java] [error] Error Init SetSgridConf "+e);
        }
    }

    public void setServer(Server server) {
        this.server = server;
    }

    public void setConfig(HashMap<String, String> config) {
        this.config = config;
    }


    public boolean threadLock(){
        String sgridProdConf = System.getenv(SGRID_CONFIG);
        if(sgridProdConf.isEmpty()){
            return System.getenv(SGRID_PROCESS_INDEX).equals("1");
        }
        return true;
    }

}
````


**ServletContainer.java**

````java
package com.sgrid.app.framework;

import java.net.InetAddress;
import java.net.UnknownHostException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;

public class ServletContainer implements WebServerFactoryCustomizer<ConfigurableServletWebServerFactory>{

    @Autowired
    private SgridConf sgridConf;

    @Override
    public void customize(ConfigurableServletWebServerFactory factory) {
        int port = 8080;
        String host = null;
        if(sgridConf.server.port != null){
            port = sgridConf.server.port;
        }
        factory.setPort(port);

        if(sgridConf.server.host != null){
            host = sgridConf.server.host;
        }
        try {
            factory.setAddress(InetAddress.getByName(host));
        } catch (UnknownHostException e) {
            e.printStackTrace();
        }
        System.out.println(String.format("[Sgrid-Java] [info] sgridConf [%s]",sgridConf));
        System.out.println("[Sgrid-Java] [info] End Init Sgrid servletContainer ");
    }
    
}
````

然后配置 sgrid.yml 文件，作为Dev环境下的配置文件
````yml
server:
  name: CustomApplication
  port: 13008
  host: 127.0.0.1
  protocol: http
  language: java
config:
  redis-addr: 127.0.0.1:6379
  redis-pass: ''
  staticPath: '' # 静态资源
  uploadPath: ''
  mysql-addr: jdbc:mysql://localhost:3306/CustomApplication?setUnicode=true&characterEncoding=utf8
  mysql-username: root
  mysql-password: '123456'

````

然后在主入口进行修改,添加 EnableSgridServer 注解

**Main.java**

````java
package com.sgrid.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.sgrid.app.framework.EnableSgridServer;

@SpringBootApplication
@EnableSgridServer
public class SgridApplication {

    public static void main(String[] args) {
        SpringApplication.run(SgridApplication.class, args);
    }
}
````

代码编写完成之后需要打包，该打包命令为一个sh脚本文件

**build.sh**
````sh
#!/bin/bash
readonly ServerName="CustomApplication"
rm -r $ServerName.tar.gz
rm -r target
# 如果有问题可以在idea上进行 下两部操作
mvn compile
mvn deploy
tar -cvf $ServerName.tar.gz ./target
````

## Maven jdbc与Mysql的坑

mysql5.x 常用 useSSL
在 mysql 8 中， 使用 jdbc:mysql://localhost:3306/test_db?setUnicode=true&characterEncoding=utf8 即可
同时jdbc 包也需要修改成8 与 mysql 对应

## Lombok 依赖的坑

Lombok某些情况下不指定版本会出现打包异常
 **com.sun.tools.javac.code.TypeTags** ,
 关键错误信息
 **Illegal reflective access by lombok.javac.apt.LombokProcessor to field com.sun.tools.javac.processing.JavacProcessingEnvironment.discoveredProcs**
 此时需要确定Lombok可以编译的版本，然后修改pom.xml文件

````xml
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.20</version>
        </dependency>
````

**Input**

## Vscode2Java

````sh
/usr/libexec/java_home -V
````
