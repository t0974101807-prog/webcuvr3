import React, { useState, useEffect, useRef } from "react";
import {
  Cpu, Activity, ShieldAlert, Key, Check, AlertTriangle, Play, RefreshCw, Send,
  Layers, Code, FileCode, Radio, Database, Server, UserCheck, Trash, Maximize2, Minimize2,
  Lock, Settings, Globe, Link2, BellRing, Terminal, Sliders, ChevronRight
} from "lucide-react";

interface ApiGatewayDashboardProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function ApiGatewayDashboard({ isFullscreen = false, onToggleFullscreen }: ApiGatewayDashboardProps) {
  const [activeTab, setActiveTab] = useState<"gateway" | "rest" | "graphql" | "grpc" | "soap" | "sse" | "webhooks" | "mqtt" | "mcp">("gateway");
  const [loading, setLoading] = useState(false);
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // MCP Sandbox state
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [selectedMcpTool, setSelectedMcpTool] = useState<any>(null);
  const [mcpArgsText, setMcpArgsText] = useState("{}");
  const [mcpAuditLogs, setMcpAuditLogs] = useState<any[]>([]);

  // Sandbox inputs
  const [restMethod, setRestMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS">("GET");
  const [restId, setRestId] = useState("");
  const [restName, setRestName] = useState("Vụ án Tranh chấp Cổ phần");
  const [restClient, setRestClient] = useState("Tập đoàn Hưng Thịnh");
  const [restFee, setRestFee] = useState(45000000);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [testRateLimit, setTestRateLimit] = useState(false);
  const [testDenyPermission, setTestDenyPermission] = useState(false);
  const [testUser, setTestUser] = useState("Luật sư Nguyễn Văn A");
  const [testRole, setTestRole] = useState("LAWYER");
  const [apiResponse, setApiResponse] = useState<any>(null);

  // GraphQL Inputs
  const [graphqlQuery, setGraphqlQuery] = useState(`query GetCases {
  cases {
    id
    name
    client
    fee
    attorneys {
      name
      role
    }
  }
}`);
  const [graphqlVariables, setGraphqlVariables] = useState(`{
  "name": "Hồ sơ tranh chấp đất đai mới",
  "client": "Nguyễn Văn C",
  "fee": 18000000
}`);

  // gRPC Inputs
  const [grpcMethod, setGrpcMethod] = useState("legalos.v1.CaseService/GetCaseDetail");
  const [grpcId, setGrpcId] = useState("HS-101");

  // SOAP Inputs
  const [soapSoapAction, setSoapSoapAction] = useState("GetCaseLegacy");
  const [soapUsername, setSoapUsername] = useState("enterprise_user_99");
  const [soapPassword, setSoapPassword] = useState("admin_secret_pass");
  const [soapCaseId, setSoapCaseId] = useState("HS-303");
  const [soapXml, setSoapXml] = useState("");

  // SSE Stream
  const [sseEventList, setSseEventList] = useState<any[]>([]);
  const [sseActive, setSseActive] = useState(false);
  const sseEventSourceRef = useRef<EventSource | null>(null);

  // Webhooks
  const [webhookUrl, setWebhookUrl] = useState("https://your-server.com/callback");
  const [webhookEvent, setWebhookEvent] = useState("case.created");
  const [webhookConfig, setWebhookConfig] = useState<any>(null);
  const [webhookTriggerResult, setWebhookTriggerResult] = useState<any>(null);

  // MQTT
  const [mqttTopic, setMqttTopic] = useState("legalos/device/rfid_reader_01/telemetry");
  const [mqttPayload, setMqttPayload] = useState(`{
  "scan_id": "RFID-TAG-9912",
  "card_holder": "Lê Hoàng Minh",
  "department": "Hình sự",
  "gate": "Cổng VIP số 2"
}`);
  const [mqttMessages, setMqttMessages] = useState<any[]>([]);

  // Load Dashboard Stats & Logs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/gateway/dashboard");
      const json = await res.json();
      if (json.success) {
        setGatewayData(json.data);
        setLogs(json.data.recentLogs || []);
      }
    } catch (err) {
      console.error("Error loading gateway telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchWebhookConfig();
    fetchMqttTopics();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Webhook config
  const fetchWebhookConfig = async () => {
    try {
      const res = await fetch("/api/v1/webhooks/config");
      const json = await res.json();
      if (json.success) {
        setWebhookConfig(json.data);
      }
    } catch (err) {}
  };

  // Fetch MQTT messages
  const fetchMqttTopics = async () => {
    try {
      const res = await fetch("/api/v1/mqtt/topics");
      const json = await res.json();
      if (json.success) {
        setMqttMessages(json.data);
      }
    } catch (err) {}
  };

  // Generate Default SOAP XML
  useEffect(() => {
    const defaultXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${soapUsername}</wsse:Username>
        <wsse:Password>${soapPassword}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <tns:GetCaseLegacyRequest xmlns:tns="http://legalos.org/soap/v1/">
      <CaseID>${soapCaseId}</CaseID>
    </tns:GetCaseLegacyRequest>
  </soap:Body>
</soap:Envelope>`;
    setSoapXml(defaultXml);
  }, [soapUsername, soapPassword, soapCaseId]);

  // Toggle Rule Status
  const handleToggleRule = async (ruleName: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/v1/gateway/toggle-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: ruleName, status: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // REST API Simulator
  const handleSendRestRequest = async () => {
    setLoading(true);
    setApiResponse(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Test-User": testUser,
        "X-Test-Role": testRole
      };

      if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
      }
      if (testRateLimit) {
        headers["X-Test-Rate-Limit"] = "trigger";
      }
      if (testDenyPermission) {
        headers["X-Test-Permission"] = "denied";
      }

      let url = "/api/v1/cases";
      let options: RequestInit = { method: restMethod, headers };

      if (restMethod === "GET" && restId) {
        url = `/api/v1/cases/${restId}`;
      } else if (restMethod === "POST") {
        options.body = JSON.stringify({
          name: restName,
          client: restClient,
          fee: restFee
        });
      } else if (restMethod === "PUT") {
        url = `/api/v1/cases/${restId || "HS-101"}`;
        options.body = JSON.stringify({
          name: restName,
          client: restClient,
          fee: restFee
        });
      } else if (restMethod === "PATCH") {
        url = `/api/v1/cases/${restId || "HS-101"}`;
        options.body = JSON.stringify({
          name: restName,
          client: restClient,
          fee: restFee
        });
      } else if (restMethod === "DELETE") {
        url = `/api/v1/cases/${restId || "HS-101"}`;
      }

      const res = await fetch(url, options);
      let data: any = null;
      if (restMethod !== "HEAD" && res.status !== 204) {
        try {
          data = await res.json();
        } catch (e) {
          data = { message: "Standard response processed" };
        }
      } else {
        data = { info: `Processed HTTP ${restMethod} successfully. Status: ${res.status}. No response body returned.` };
      }
      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        headers: {
          "X-Request-ID": res.headers.get("X-Request-ID"),
          "X-Correlation-ID": res.headers.get("X-Correlation-ID"),
          "X-Cache-Idempotency": res.headers.get("X-Cache-Idempotency"),
          "Content-Type": res.headers.get("Content-Type")
        },
        body: data
      });
      fetchDashboardData();
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // GraphQL Simulator
  const handleSendGraphqlRequest = async () => {
    setLoading(true);
    setApiResponse(null);
    try {
      let parsedVariables = {};
      try {
        parsedVariables = JSON.parse(graphqlVariables);
      } catch (e) {}

      const res = await fetch("/api/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Test-User": testUser,
          "X-Test-Role": testRole
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: parsedVariables
        })
      });
      const data = await res.json();
      setApiResponse({
        status: res.status,
        headers: {
          "X-Request-ID": res.headers.get("X-Request-ID"),
          "Content-Type": res.headers.get("Content-Type")
        },
        body: data
      });
      fetchDashboardData();
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // gRPC Simulator
  const handleSendGrpcRequest = async () => {
    setLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch("/api/v1/grpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Grpc-Method": grpcMethod,
          "X-Test-User": testUser,
          "X-Test-Role": testRole
        },
        body: JSON.stringify({
          requestBody: { id: grpcId }
        })
      });
      const data = await res.json();
      setApiResponse({
        status: res.status,
        headers: {
          "X-Request-ID": res.headers.get("X-Request-ID"),
          "Content-Type": res.headers.get("Content-Type")
        },
        body: data
      });
      fetchDashboardData();
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // SOAP Simulator
  const handleSendSoapRequest = async () => {
    setLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch("/api/v1/soap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Test-User": testUser,
          "X-Test-Role": testRole
        },
        body: JSON.stringify({ xml: soapXml })
      });
      const data = await res.text();
      setApiResponse({
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type")
        },
        body: data
      });
      fetchDashboardData();
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // SSE Controller
  const handleStartSse = () => {
    if (sseActive) {
      if (sseEventSourceRef.current) sseEventSourceRef.current.close();
      setSseActive(false);
      return;
    }

    setSseEventList([]);
    setSseActive(true);

    const sseUrl = `/api/v1/sse?user=${encodeURIComponent(testUser)}`;
    const evs = new EventSource(sseUrl);
    sseEventSourceRef.current = evs;

    evs.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setSseEventList((prev) => [...prev, { type: "Message", data }]);
      } catch (err) {}
    };

    evs.addEventListener("AI_PROGRESS", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setSseEventList((prev) => [...prev, { type: "AI_PROGRESS", data }]);
      } catch (err) {}
    });

    evs.addEventListener("AI_COMPLETED", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setSseEventList((prev) => [...prev, { type: "AI_COMPLETED", data }]);
        evs.close();
        setSseActive(false);
      } catch (err) {}
    });

    evs.onerror = () => {
      evs.close();
      setSseActive(false);
    };
  };

  // Webhook Register
  const handleRegisterWebhook = async () => {
    try {
      const res = await fetch("/api/v1/webhooks/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, events: [webhookEvent] })
      });
      const json = await res.json();
      if (json.success) {
        fetchWebhookConfig();
        alert("Đăng ký Webhook nhận tin thành công!");
      }
    } catch (e) {}
  };

  // Webhook Trigger Test
  const handleTriggerWebhook = async () => {
    setLoading(true);
    setWebhookTriggerResult(null);
    try {
      const res = await fetch("/api/v1/webhooks/trigger-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: webhookEvent, endpointUrl: webhookUrl })
      });
      const json = await res.json();
      setWebhookTriggerResult(json);
      fetchWebhookConfig();
      fetchDashboardData();
    } catch (err: any) {
      setWebhookTriggerResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // MQTT Simulator
  const handlePublishMqtt = async () => {
    setLoading(true);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(mqttPayload);
      } catch (e) {
        parsedPayload = { raw: mqttPayload };
      }

      const res = await fetch("/api/v1/mqtt/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Test-User": testUser
        },
        body: JSON.stringify({
          topic: mqttTopic,
          payload: parsedPayload,
          qos: 1
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchMqttTopics();
        fetchDashboardData();
      }
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  // Fetch MCP tools and audit logs
  const fetchMcpData = async () => {
    try {
      const resTools = await fetch("/api/v1/mcp/tools");
      const jsonTools = await resTools.json();
      if (jsonTools.success) {
        setMcpTools(jsonTools.data);
        if (jsonTools.data.length > 0 && !selectedMcpTool) {
          const firstTool = jsonTools.data[0];
          setSelectedMcpTool(firstTool);
          setMcpArgsText(JSON.stringify(getDefaultMcpArgs(firstTool.name), null, 2));
        }
      }
      
      const resLogs = await fetch("/api/v1/mcp/audit-logs");
      const jsonLogs = await resLogs.json();
      if (jsonLogs.success) {
        setMcpAuditLogs(jsonLogs.data);
      }
    } catch (err) {
      console.error("Error fetching MCP data:", err);
    }
  };

  const getDefaultMcpArgs = (toolName: string) => {
    switch (toolName) {
      case "search_memories":
        return { query: "án lệ", limit: 3 };
      case "store_memory":
        return {
          title: "Kinh nghiệm tư vấn ly hôn",
          content: "Lưu ý khi phân chia tài sản chung là quyền sử dụng đất của hộ gia đình cần làm rõ thành viên hộ gia đình tại thời điểm cấp giấy chứng nhận...",
          memory_type: "case_insight",
          category: "legal_preference",
          importance_score: 0.85,
          tags: ["hon_nhan", "dat_dai"]
        };
      case "get_case_memory":
        return { case_id: "HS-101" };
      case "get_mcp_tools":
        return { domain: "MEMORY" };
      case "search_cases":
        return { query: "Tranh chấp", limit: 5 };
      case "get_case":
        return { case_id: "HS-101" };
      case "search_clients":
        return { query: "Thịnh", limit: 5 };
      case "get_client":
        return { client_id: "KH-001" };
      case "search_laws":
        return { query: "Đất đai", limit: 5 };
      case "search_judgments":
        return { query: "Dân sự" };
      case "search_precedents":
        return { query: "Số 01" };
      default:
        return {};
    }
  };

  const handleExecuteMcpTool = async () => {
    if (!selectedMcpTool) return;
    setLoading(true);
    setApiResponse(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(mcpArgsText);
      } catch (e) {
        alert("JSON đối số không hợp lệ!");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/v1/mcp/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Test-User": testUser,
          "X-Test-Role": testRole,
          "x-test-user-email": "levantai28072000@gmail.com"
        },
        body: JSON.stringify({
          toolName: selectedMcpTool.name,
          args: parsedArgs
        })
      });
      const data = await res.json();
      setApiResponse({
        status: res.status,
        headers: {
          "X-Request-ID": res.headers.get("X-Request-ID"),
          "X-Correlation-ID": res.headers.get("X-Correlation-ID"),
          "Content-Type": res.headers.get("Content-Type")
        },
        body: data
      });
      
      // Refresh MCP data & general gateway dashboard
      fetchMcpData();
      fetchDashboardData();
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mcp") {
      fetchMcpData();
    }
  }, [activeTab]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (status >= 400 && status < 500) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const getProtocolIcon = (proto: string) => {
    switch (proto?.toUpperCase()) {
      case "REST": return <Layers size={12} className="text-blue-500" />;
      case "GRAPHQL": return <Code size={12} className="text-pink-500" />;
      case "GRPC": return <Server size={12} className="text-teal-500" />;
      case "SOAP": return <FileCode size={12} className="text-orange-500" />;
      case "SSE": return <Radio size={12} className="text-purple-500" />;
      case "WEBHOOK": return <BellRing size={12} className="text-amber-500" />;
      case "MQTT": return <Cpu size={12} className="text-emerald-500" />;
      default: return <Link2 size={12} className="text-slate-400" />;
    }
  };

  return (
    <div id="api_gateway_dashboard_hub" className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col w-full text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 text-slate-100 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Cpu size={20} className="animate-pulse" />
            </span>
            <h2 className="text-lg font-serif font-bold uppercase tracking-wide">
              Cổng Điều Hướng Đa Giao Thức API Gateway
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Lớp cổng kiểm soát trung tâm hỗ trợ REST v1, GraphQL, gRPC-Web, SOAP Adapter, SSE, Webhooks và MQTT/IoT cho hệ sinh thái Legal OS.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Đồng bộ Gateway</span>
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* CORE GATEWAY TELEMETRY CARDS */}
      {gatewayData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 bg-slate-100 border-b border-slate-200">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Tổng Request</span>
              <Activity size={14} className="text-indigo-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-800">{gatewayData.metrics.totalRequests}</span>
              <span className="text-[9px] block text-slate-500">Toàn bộ cổng giao thức</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Blocked (WAF/Limit)</span>
              <ShieldAlert size={14} className="text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-amber-600">{gatewayData.metrics.blockedRequests}</span>
              <span className="text-[9px] block text-slate-500">Tự động chặn tấn công</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Yêu cầu Lỗi (5xx)</span>
              <AlertTriangle size={14} className="text-rose-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-rose-600">{gatewayData.metrics.errorRequests}</span>
              <span className="text-[9px] block text-slate-500">Tỷ lệ sự cố: 0.12%</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">WebSocket Sockets</span>
              <Radio size={14} className="text-sky-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-sky-600">{gatewayData.metrics.activeSockets}</span>
              <span className="text-[9px] block text-sky-500">Realtime channels</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">MQTT Messages</span>
              <Cpu size={14} className="text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-emerald-600">{gatewayData.metrics.mqttMessages}</span>
              <span className="text-[9px] block text-slate-500">IoT Gateway Telemetry</span>
            </div>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE CONTENT AREA */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[450px]">
        
        {/* PROTOCOLS SIDE TABS */}
        <div className="w-full lg:w-56 bg-slate-100 border-r border-slate-200 p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2 hidden lg:block">Cổng Kiểm Soát</div>
          <button
            onClick={() => setActiveTab("gateway")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "gateway" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Settings size={14} />
            <span>Quản trị Gateway</span>
          </button>

          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-4 mb-2 hidden lg:block">Protocol Sandbox</div>
          
          <button
            onClick={() => setActiveTab("rest")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "rest" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Layers size={14} />
            <span>1. REST API v1</span>
          </button>
          
          <button
            onClick={() => setActiveTab("graphql")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "graphql" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Code size={14} />
            <span>2. GraphQL API</span>
          </button>

          <button
            onClick={() => setActiveTab("grpc")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "grpc" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Server size={14} />
            <span>3. gRPC Service</span>
          </button>

          <button
            onClick={() => setActiveTab("soap")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "soap" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <FileCode size={14} />
            <span>4. SOAP Adapter</span>
          </button>

          <button
            onClick={() => setActiveTab("sse")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "sse" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Radio size={14} />
            <span>5. SSE Streaming</span>
          </button>

          <button
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "webhooks" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <BellRing size={14} />
            <span>6. Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab("mqtt")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "mqtt" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Cpu size={14} />
            <span>7. MQTT / IoT API</span>
          </button>

          <button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "mcp" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
          >
            <Terminal size={14} />
            <span>8. MCP Model Context</span>
          </button>
        </div>

        {/* WORKSPACE CONTENT BODY */}
        <div className="flex-1 p-5 overflow-y-auto max-h-[700px]">
          
          {/* ======================================================================= */}
          {/* TAB 0: GENERAL GATEWAY CONTROLS & MANAGEMENT                           */}
          {/* ======================================================================= */}
          {activeTab === "gateway" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Sliders size={16} className="text-indigo-600" />
                  <span>Kích Hoạt Chính Sách API Gateway</span>
                </h3>
                
                {gatewayData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Giới hạn Tần suất (Rate Limiting)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Chống spam, tự động hạn chế IP gửi dồn dập requests.</div>
                      </div>
                      <button
                        onClick={() => handleToggleRule("rate_limiting", gatewayData.activeRules.rateLimiting)}
                        className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${gatewayData.activeRules.rateLimiting ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"}`}
                      >
                        <span className="w-5 h-5 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Ứng dụng Tường lửa (WAF)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Chặn SQLi, XSS, Path Traversal, Bot scanners.</div>
                      </div>
                      <button
                        onClick={() => handleToggleRule("waf_protection", gatewayData.activeRules.wafProtection)}
                        className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${gatewayData.activeRules.wafProtection ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"}`}
                      >
                        <span className="w-5 h-5 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Kiểm tra Vai trò (RBAC Audit)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Kiểm tra nghiêm ngặt Scope quyền của từng user.</div>
                      </div>
                      <button
                        onClick={() => handleToggleRule("rbac_checking", gatewayData.activeRules.rbacChecking)}
                        className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${gatewayData.activeRules.rbacChecking ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"}`}
                      >
                        <span className="w-5 h-5 bg-white rounded-full shadow-md" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* REQUEST TRACING SCHEMATIC */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
                  <Layers size={16} className="text-indigo-600" />
                  <span>Sơ đồ Truy vết Giao dịch (Request/Trace Tracing)</span>
                </h3>
                <div className="bg-slate-900 rounded-xl p-4 text-slate-300 text-xs font-mono space-y-2.5 overflow-x-auto">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <span>[Web Client / App Mobile]</span>
                    <ChevronRight size={12} className="text-slate-500" />
                    <span>Gửi yêu cầu kèm X-Correlation-ID</span>
                  </div>
                  <div className="pl-4 border-l-2 border-indigo-500/20 py-1 space-y-1">
                    <p className="text-slate-400">// Sinh mã Trace ID đồng bộ giao dịch từ bên ngoài</p>
                    <p className="text-amber-400">Headers: X-Correlation-ID = trace_b8a1c900e82a</p>
                  </div>

                  <div className="flex items-center gap-2 text-sky-400">
                    <span>[API Gateway Layer]</span>
                    <ChevronRight size={12} className="text-slate-500" />
                    <span>Xác thực, phân tích WAF, phân tải, sinh Request-ID</span>
                  </div>
                  <div className="pl-4 border-l-2 border-sky-500/20 py-1 space-y-1">
                    <p className="text-slate-400">// Sinh mã requestId cho từng request con riêng biệt</p>
                    <p className="text-emerald-400">Log: Request req_991b2c8a7b - IP 104.18.23.90 - Rate-Limit: PASS</p>
                  </div>

                  <div className="flex items-center gap-2 text-teal-400">
                    <span>[gRPC Internal Communication]</span>
                    <ChevronRight size={12} className="text-slate-500" />
                    <span>Gọi dịch vụ AI & RAG nghiệp vụ nội bộ</span>
                  </div>
                  <div className="pl-4 border-l-2 border-teal-500/20 py-1 space-y-1">
                    <p className="text-slate-400">// Đồng bộ TraceID qua Proto Metadata để phân tách microservices</p>
                    <p className="text-teal-400">gRPC.Metadata: trace-id = trace_b8a1c900e82a</p>
                  </div>
                </div>
              </div>

              {/* AUDIT LOGS TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-3">
                  <Database size={16} className="text-indigo-600" />
                  <span>Sổ Nhật Ký Kiểm Toán Gateway (Audit Logs)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Thời gian</th>
                        <th className="py-2.5 px-3">Giao thức</th>
                        <th className="py-2.5 px-3">Tài khoản</th>
                        <th className="py-2.5 px-3">Hành động / Route</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Mã Request ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">Chưa có bản ghi hoạt động nào.</td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                              <span className="flex items-center gap-1">
                                {getProtocolIcon(log.protocol)}
                                <span>{log.protocol}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">{log.user}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-xs truncate" title={log.action}>
                              {log.action}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(log.status)}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">{log.request_id}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 1: REST API SANDBOX                                                */}
          {/* ======================================================================= */}
          {activeTab === "rest" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                    <Terminal size={14} />
                    <span>REST Sandbox Terminal</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Method</label>
                        <select
                          value={restMethod}
                          onChange={(e: any) => setRestMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                          <option value="HEAD">HEAD</option>
                          <option value="OPTIONS">OPTIONS</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Target ID (Optional)</label>
                        <input
                          type="text"
                          value={restId}
                          onChange={(e) => setRestId(e.target.value)}
                          placeholder="e.g., HS-101"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {(restMethod === "POST" || restMethod === "PUT") && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Post Payload</div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block">Tên vụ việc</label>
                          <input
                            type="text"
                            value={restName}
                            onChange={(e) => setRestName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block">Khách hàng</label>
                          <input
                            type="text"
                            value={restClient}
                            onChange={(e) => setRestClient(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block">Phí dịch vụ (VNĐ)</label>
                          <input
                            type="number"
                            value={restFee}
                            onChange={(e) => setRestFee(parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* GATEWAY CONTROL INJECTORS */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Gateway Simulation Injector</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500">Idempotency-Key</label>
                          <input
                            type="text"
                            value={idempotencyKey}
                            onChange={(e) => setIdempotencyKey(e.target.value)}
                            placeholder="e.g. key_11223"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500">X-Test-Role</label>
                          <select
                            value={testRole}
                            onChange={(e) => setTestRole(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="LAWYER">LAWYER</option>
                            <option value="CLIENT">CLIENT</option>
                            <option value="GUEST">GUEST (No Auth)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testRateLimit}
                            onChange={(e) => setTestRateLimit(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Mô phỏng Rate-Limit Trigger (HTTP 429)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testDenyPermission}
                            onChange={(e) => setTestDenyPermission(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Mô phỏng Thiếu Scope Quyền (HTTP 403)</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleSendRestRequest}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Play size={13} />
                      <span>Thực thi REST API Call</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* REST API RESPONSE */}
              <div className="flex flex-col">
                <ResponseInspector response={apiResponse} />
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 2: GRAPHQL API SANDBOX                                             */}
          {/* ======================================================================= */}
          {activeTab === "graphql" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-3 flex items-center gap-1.5">
                    <Code size={14} />
                    <span>GraphQL Query Console</span>
                  </h4>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] font-sans font-bold text-slate-500 block mb-1">GraphQL Query</label>
                      <textarea
                        value={graphqlQuery}
                        onChange={(e) => setGraphqlQuery(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-900 text-slate-200 p-3 rounded-xl focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-sans font-bold text-slate-500 block mb-1">Query Variables (JSON)</label>
                      <textarea
                        value={graphqlVariables}
                        onChange={(e) => setGraphqlVariables(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-900 text-slate-200 p-3 rounded-xl focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      onClick={handleSendGraphqlRequest}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-sans flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Play size={13} />
                      <span>Thực thi GraphQL Query</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <ResponseInspector response={apiResponse} />
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 3: gRPC OVER HTTP2 SIMULATION                                      */}
          {/* ======================================================================= */}
          {activeTab === "grpc" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-3 flex items-center gap-1.5">
                    <Server size={14} />
                    <span>gRPC-Web Service Executor</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Proto Method & Pattern</label>
                      <select
                        value={grpcMethod}
                        onChange={(e) => setGrpcMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="legalos.v1.CaseService/GetCaseDetail">Unary: GetCaseDetail (Request / Response)</option>
                        <option value="legalos.v1.CaseService/StreamCaseUpdates">Server Streaming: StreamCaseUpdates (Server -&gt; Client)</option>
                        <option value="legalos.v1.CaseService/UploadTelemetryData">Client Streaming: UploadTelemetryData (Client -&gt; Server)</option>
                        <option value="legalos.v1.CaseService/BidiChat">Bidirectional Streaming: BidiChat (Both ways)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Proto Message Argument (id)</label>
                      <input
                        type="text"
                        value={grpcId}
                        onChange={(e) => setGrpcId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Protobuf Interface Definition</div>
                      <pre className="text-[9px] font-mono text-slate-600 bg-white p-2 border border-slate-200 rounded overflow-x-auto">
{`syntax = "proto3";
package legalos.v1;

service CaseService {
  rpc GetCaseDetail (CaseIdRequest) returns (CaseDetailResponse);
  rpc StreamCaseUpdates (StreamRequest) returns (stream CaseEventResponse);
}`}
                      </pre>
                    </div>

                    <button
                      onClick={handleSendGrpcRequest}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Play size={13} />
                      <span>Gọi phương thức gRPC</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <ResponseInspector response={apiResponse} />
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 4: SOAP ADAPTER FOR LEGACY INTEGRATIONS                            */}
          {/* ======================================================================= */}
          {activeTab === "soap" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                      <FileCode size={14} />
                      <span>SOAP XML Adapter Terminal</span>
                    </h4>
                    <a
                      href="/api/v1/soap?wsdl"
                      target="_blank"
                      className="text-[10px] text-orange-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Globe size={10} />
                      <span>Xem WSDL Schema</span>
                    </a>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">WS-Security User</label>
                        <input
                          type="text"
                          value={soapUsername}
                          onChange={(e) => setSoapUsername(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">SOAP CaseID</label>
                        <input
                          type="text"
                          value={soapCaseId}
                          onChange={(e) => setSoapCaseId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">SOAP XML Payload (WS-Security Embedded)</label>
                      <textarea
                        value={soapXml}
                        onChange={(e) => setSoapXml(e.target.value)}
                        rows={8}
                        className="w-full bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px] focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSendSoapRequest}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Play size={13} />
                      <span>Post SOAP SOAP-Envelope</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <ResponseInspector response={apiResponse} isXml />
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 5: SSE STREAMING (SERVER-SENT EVENTS)                               */}
          {/* ======================================================================= */}
          {activeTab === "sse" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-3 flex items-center gap-1.5">
                    <Radio size={14} className={sseActive ? "animate-pulse" : ""} />
                    <span>Server-Sent Events (SSE) Listener</span>
                  </h4>
                  
                  <p className="text-xs text-slate-600 mb-3">
                    SSE được tối ưu cho các luồng dữ liệu một chiều (Server → Client). Thích hợp nhất cho việc theo dõi tiến trình phân tích AI dài hạn, OCR, hay trạng thái số hóa văn bản.
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Stream Configuration</div>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-600">Endpoint:</span> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-600 font-mono">GET /api/v1/sse</code>
                    </div>
                  </div>

                  <button
                    onClick={handleStartSse}
                    className={`w-full font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${sseActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
                  >
                    <Radio size={13} />
                    <span>{sseActive ? "Hủy kết nối Stream" : "Mở luồng sự kiện SSE"}</span>
                  </button>
                </div>
              </div>

              {/* STREAM VIEWER */}
              <div className="bg-slate-900 rounded-2xl p-5 flex flex-col justify-between min-h-[350px] shadow-sm text-slate-200">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">SSE Feed Stream</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${sseActive ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
                  </div>
                  
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto font-mono text-[11px]">
                    {sseEventList.length === 0 ? (
                      <div className="text-slate-500 italic py-4">Luồng stream rỗng. Nhấn nút mở luồng để đón nhận sự kiện trực tiếp từ Legal AI Engine.</div>
                    ) : (
                      sseEventList.map((evt, i) => (
                        <div key={i} className="p-2 rounded bg-slate-800 border border-slate-700 space-y-1">
                          <div className="flex justify-between text-[9px] text-purple-400 font-bold">
                            <span>Event: {evt.type}</span>
                            <span>{new Date(evt.data.timestamp || Date.now()).toLocaleTimeString()}</span>
                          </div>
                          {evt.type === "AI_PROGRESS" ? (
                            <div>
                              <div className="text-slate-300 font-bold">{evt.data.status}</div>
                              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${evt.data.progress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <pre className="text-[10px] text-slate-400 overflow-x-auto">{JSON.stringify(evt.data, null, 2)}</pre>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 text-right mt-3">Connection: HTTP/1.1 chunked transfer</div>
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 6: WEBHOOKS INBOUND/OUTBOUND RETRY ENGINE                          */}
          {/* ======================================================================= */}
          {activeTab === "webhooks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                    <BellRing size={14} />
                    <span>Xác thực & Thử lại Webhook (HMAC Outbound)</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Đích Nhận (Endpoint URL)</label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-server.com/callback"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-0.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">Mã Sự Kiện (Event)</label>
                        <select
                          value={webhookEvent}
                          onChange={(e) => setWebhookEvent(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 mt-0.5"
                        >
                          <option value="case.created">case.created</option>
                          <option value="case.updated">case.updated</option>
                          <option value="payment.completed">payment.completed</option>
                          <option value="document.processed">document.processed</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleRegisterWebhook}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl text-xs transition cursor-pointer"
                        >
                          Đăng ký Outbound
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Xác thực HMAC SHA256 Chữ ký</div>
                      <p className="text-[10px] text-slate-600">
                        Chữ ký tự động phát sinh bằng cách băm chuỗi <code className="bg-slate-200 font-mono px-1 rounded">timestamp.payload</code> với mật khóa Webhook Secret. Header: <code className="bg-slate-200 font-mono px-1 rounded">X-Webhook-Signature</code>
                      </p>
                      {webhookConfig && (
                        <div className="mt-2 text-[10px] font-mono text-amber-600 truncate">
                          Secret: {webhookConfig.secret}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleTriggerWebhook}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Send size={13} />
                        <span>Kích Hoạt Gửi Webhook</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          // demo fail for showing retry
                          setWebhookUrl(webhookUrl.includes("fail_demo") ? "https://your-server.com/callback" : "https://your-server.com/callback/fail_demo");
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition ${webhookUrl.includes("fail_demo") ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        {webhookUrl.includes("fail_demo") ? "Bật Demo Thất Bại (Retrying)" : "Tắt Demo Thất Bại"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* WEBHOOK OUTBOUND DELIVERIES AND LOGS */}
              <div className="flex flex-col gap-4">
                {webhookTriggerResult && (
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[10.5px] border border-slate-800">
                    <div className="text-amber-400 font-bold border-b border-slate-800 pb-1 mb-2 uppercase text-[9px] tracking-wider">
                      Trạng thái phát sự kiện Webhook Outbound
                    </div>
                    <div>ID Gửi: {webhookTriggerResult.data.deliveryId}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${webhookTriggerResult.data.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {webhookTriggerResult.data.status}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-400">Timestamp: {webhookTriggerResult.data.timestampSent}</div>
                    <div className="text-slate-400 truncate">Signature: {webhookTriggerResult.data.signatureSent}</div>
                    <div className="mt-2 bg-slate-800 p-2 rounded max-h-[100px] overflow-y-auto">
                      Payload: {JSON.stringify(webhookTriggerResult.data.payload, null, 2)}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
                  <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 uppercase tracking-wider">
                    Nhật ký phát lại Webhook (Retry & Dead Letter Queue)
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto text-[11px]">
                    {webhookConfig?.logs && webhookConfig.logs.length === 0 ? (
                      <div className="text-slate-400 italic">Chưa có lịch sử phát lại. Hãy nhấn "Kích hoạt gửi" để xem thuật toán thử lại luỹ thừa tự động (Exponential Backoff).</div>
                    ) : (
                      webhookConfig?.logs.map((wl: any) => (
                        <div key={wl.id} className="p-2 bg-slate-50 border border-slate-100 rounded flex justify-between gap-4">
                          <div>
                            <div className="font-semibold text-slate-700 truncate max-w-[200px]">{wl.url}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Sự kiện: {wl.event} | Lần thử: {wl.attempt}</div>
                            {wl.error && <div className="text-[9px] text-rose-500 mt-1">{wl.error}</div>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${wl.status === "success" ? "bg-emerald-100 text-emerald-700" : wl.status === "retry" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                              {wl.status}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-1">{new Date(wl.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ======================================================================= */}
          {/* TAB 7: MQTT / IOT GATEWAY                                               */}
          {/* ======================================================================= */}
          {activeTab === "mqtt" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1.5">
                    <Cpu size={14} />
                    <span>MQTT / IoT Client Terminal</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">MQTT Topic</label>
                      <input
                        type="text"
                        value={mqttTopic}
                        onChange={(e) => setMqttTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">JSON Payload (IoT Telemetry / RFID sensor)</label>
                      <textarea
                        value={mqttPayload}
                        onChange={(e) => setMqttPayload(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handlePublishMqtt}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Publish IoT MQTT Event</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTIVE MQTT BROKER FEED */}
              <div className="bg-slate-900 rounded-2xl p-5 shadow-sm text-slate-200 flex flex-col justify-between min-h-[350px]">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Server size={12} />
                      <span>LegalOS IoT Broker Topics</span>
                    </span>
                    <span className="text-[9px] text-slate-500">Server: mqtt://gateway.legalos.internal:1883</span>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto font-mono text-[10.5px]">
                    {mqttMessages.map((msg, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-800 border border-slate-700 rounded space-y-1">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-emerald-400 font-bold">{msg.topic}</span>
                          <span className="text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <pre className="text-[10px] text-slate-300 whitespace-pre-wrap">{JSON.stringify(msg.payload, null, 2)}</pre>
                        <div className="text-[8px] text-slate-500 text-right">QoS: {msg.qos}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 mt-2 text-right">Hệ thống IoT tích hợp ESP32, Camera OCR và Cảm biến cửa RFID</div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 8: MODEL CONTEXT PROTOCOL (MCP) INTEGRATION                       */}
          {/* ======================================================================= */}
          {activeTab === "mcp" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: TOOLS SELECTOR & ARGUMENTS EDITOR */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                      <Terminal size={14} />
                      <span>Model Context Protocol (MCP) Sandbox</span>
                    </h4>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Chọn Công Cụ MCP (Registered Tools)</label>
                        <select
                          value={selectedMcpTool?.name || ""}
                          onChange={(e) => {
                            const tool = mcpTools.find(t => t.name === e.target.value);
                            if (tool) {
                              setSelectedMcpTool(tool);
                              setMcpArgsText(JSON.stringify(getDefaultMcpArgs(tool.name), null, 2));
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                        >
                          {mcpTools.map((t) => (
                            <option key={t.name} value={t.name}>
                              [{t.domain}] {t.name} ({t.riskLevel})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedMcpTool && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Thông tin Tool</span>
                            <span className={`px-2 py-0.5 rounded-[4px] text-[8.5px] font-bold tracking-wide ${
                              selectedMcpTool.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                              selectedMcpTool.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              selectedMcpTool.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              Risk: {selectedMcpTool.riskLevel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 leading-relaxed font-semibold">{selectedMcpTool.description}</div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200 pt-2 text-slate-500">
                            <div>Quyền tối thiểu: <span className="font-bold text-slate-700">{selectedMcpTool.requiredPermission}</span></div>
                            <div>Domain: <span className="font-bold text-slate-700">{selectedMcpTool.domain}</span></div>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-500">Đối Số Gọi Tool (Arguments JSON)</label>
                          <span className="text-[9px] text-slate-400 font-mono">Format: Valid JSON Object</span>
                        </div>
                        <textarea
                          value={mcpArgsText}
                          onChange={(e) => setMcpArgsText(e.target.value)}
                          rows={10}
                          className="w-full bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        onClick={handleExecuteMcpTool}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/10"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Thực Thi MCP Tool qua API Gateway</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: RESPONSE INSPECTOR & AUDIT STREAM */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <ResponseInspector response={apiResponse} />

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Database size={14} className="text-indigo-600" />
                        <span>Lịch Sử Kiểm Toán MCP (MCP Audit Stream)</span>
                      </div>
                      <button
                        onClick={fetchMcpData}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                        title="Tải lại nhật ký"
                      >
                        <RefreshCw size={12} />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto text-[11px]">
                      {mcpAuditLogs.length === 0 ? (
                        <div className="text-slate-400 italic py-4 text-center">Chưa có bản ghi kiểm toán MCP nào được ghi nhận.</div>
                      ) : (
                        mcpAuditLogs.map((log) => (
                          <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-800 font-mono">[{log.mcp_tool}]</span>
                                <span className="text-slate-400 text-[10px] ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${log.success ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {log.success ? "Success" : "Failed"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 truncate">
                              <span className="font-semibold text-indigo-600">{log.user_email}</span> | Agent: {log.ai_agent} | ID: {log.device_id || "None"}
                            </div>
                            <div className="bg-slate-900 p-2.5 rounded text-[10px] font-mono text-slate-300 overflow-x-auto">
                              <div>Command: {log.command}</div>
                              {log.result && <div className="text-slate-400 truncate mt-0.5">Result: {log.result}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Sub-component to Inspect REST/GraphQL responses beautifully
function ResponseInspector({ response, isXml = false }: { response: any; isXml?: boolean }) {
  if (!response) {
    return (
      <div className="bg-slate-900 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 min-h-[350px] shadow-sm flex-1">
        <Code size={30} className="text-slate-600 mb-2" />
        <span className="text-xs font-mono">Đang đợi yêu cầu Sandbox thực thi...</span>
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="bg-slate-900 rounded-2xl p-5 flex-1 min-h-[350px] shadow-sm text-slate-200 font-mono text-xs">
        <div className="text-rose-500 font-bold mb-2">NETWORK EXCEPTION</div>
        <pre className="bg-slate-850 p-3 rounded text-rose-300 border border-rose-950/45">{response.error}</pre>
      </div>
    );
  }

  const hasHeaders = response.headers !== undefined;

  return (
    <div className="bg-slate-900 rounded-2xl p-5 flex-1 flex flex-col min-h-[350px] shadow-sm text-slate-200">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Response Console Inspector</span>
        {response.status && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${response.status >= 200 && response.status < 300 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
            HTTP {response.status}
          </span>
        )}
      </div>

      {hasHeaders && (
        <div className="mb-3">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Response Headers (Gateway-Injected)</div>
          <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 space-y-1">
            <div><span className="text-indigo-400">X-Request-ID:</span> {response.headers["X-Request-ID"] || "None"}</div>
            <div><span className="text-indigo-400">X-Correlation-ID:</span> {response.headers["X-Correlation-ID"] || "None"}</div>
            {response.headers["X-Cache-Idempotency"] && (
              <div className="text-yellow-400"><span className="text-yellow-500">X-Cache-Idempotency:</span> {response.headers["X-Cache-Idempotency"]}</div>
            )}
            <div><span className="text-indigo-400">Content-Type:</span> {response.headers["Content-Type"]}</div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Response Payload Body</div>
        <div className="flex-1 bg-slate-950 rounded p-3 overflow-auto max-h-[320px]">
          {isXml ? (
            <pre className="text-[10.5px] font-mono text-amber-300 leading-relaxed whitespace-pre-wrap">
              {response.body}
            </pre>
          ) : (
            <pre className="text-[10.5px] font-mono text-emerald-400 leading-relaxed">
              {JSON.stringify(response.body, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
