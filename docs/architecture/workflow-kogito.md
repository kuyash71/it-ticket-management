# Workflow Architecture (Kogito / Apache KIE)

## Amaç

Ticket yaşam döngüsü davranışlarını BPMN 2.0 tabanlı workflow engine üzerinden standardize etmek.

## Teknoloji Seçimi

| Özellik               | jBPM 7.x (eski)           | Kogito 10.x (mevcut)                   |
| --------------------- | ------------------------- | -------------------------------------- |
| Java desteği          | Java 11 (resmi)           | Java 17+ (native)                      |
| Spring Boot desteği   | Evet (7.x API)            | Evet (`kogito-spring-boot-starter`)    |
| Çalışma modeli        | Runtime KieSession        | Compile-time code generation           |
| API                   | `KieSession.startProcess` | Generated process service sınıfları    |
| Aktif geliştirme      | Hayır (EOL 2023)          | Evet (Apache Foundation)               |

## Maven Koordinatları

```xml
<dependency>
    <groupId>org.kie.kogito</groupId>
    <artifactId>kogito-spring-boot-starter</artifactId>
    <version>${kogito.version}</version>
</dependency>
```

Build plugin (BPMN → Java code generation):

```xml
<plugin>
    <groupId>org.kie.kogito</groupId>
    <artifactId>kogito-maven-plugin</artifactId>
    <version>${kogito.version}</version>
    <executions>
        <execution>
            <goals><goal>generateModel</goal></goals>
        </execution>
    </executions>
</plugin>
```

## Çalışma Modeli

jBPM 7.x'te process'ler runtime'da `KieSession` üzerinden başlatılırdı:

```java
// jBPM 7.x — artık kullanılmıyor
KieSession session = container.newKieSession("itsm-ticket-session");
session.startProcess("itsm.incident.lifecycle", variables);
```

Kogito'da BPMN dosyaları **compile-time**'da işlenir. Maven plugin, her process için bir Java servis sınıfı üretir. `TicketWorkflowService`, bu generate edilmiş servis üzerinden çalışır:

```java
// Kogito — generate edilmiş servis inject edilir
@Autowired
private Processes processes;

public Long startTicketLifecycle(Map<String, Object> variables) {
    Process<IncidentModel> process = (Process<IncidentModel>)
        processes.processById("itsm.incident.lifecycle");
    ProcessInstance<IncidentModel> instance = process.createInstance(...);
    instance.start();
    return instance.id();
}
```

## BPMN Dosyaları

BPMN 2.0 dosyaları değişmez — aynı standart kullanılır.

| Dosya                                         | Process ID                      |
| --------------------------------------------- | ------------------------------- |
| `resources/processes/incident-lifecycle.bpmn2`        | `itsm.incident.lifecycle`       |
| `resources/processes/service-request-lifecycle.bpmn2` | `itsm.service-request.lifecycle`|

## Tetikleme

`TicketService#create` sonrasında process başlatılır. Dönen process instance ID, `Ticket.processInstanceId` alanına kaydedilir.

## kmodule.xml Durumu

jBPM 7.x'te gerekli olan `kmodule.xml` ve `itsm-ticket-session` session tanımı Kogito'da **kullanılmaz**. Kogito process'leri classpath'teki BPMN dosyalarını otomatik olarak tarar.
