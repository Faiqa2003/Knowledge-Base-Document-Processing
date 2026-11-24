import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  LayoutDashboard,
  MessageSquare,
  Files,
  Settings,
  HelpCircle,
  Bell,
  Plus,
  ArrowUpRight,
  FileText,
  Clock,
  Sparkles,
  Send,
  BookOpen,
  History,
  Trash2,
  Search,
  RefreshCw,
  Database
} from "lucide-react";

// =====================================
// LOAD SAVED CONVERSATIONS
// =====================================

const loadConversations = () => {
  try {
    const saved = localStorage.getItem("novatech_conversations");
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to load conversations:", error);
    return [];
  }
};

// =====================================
// DEFAULT SETTINGS
// =====================================

const defaultSettings = {
  workspaceName: "NovaTech",
  companyName: "NovaTech Solutions",
  workspaceDescription:
    "Your company's knowledge, organized and ready whenever you need it.",
  assistantName: "NovaTech AI Assistant",
  welcomeMessage:
    "Ask anything about company policies, procedures, manuals, and internal documents.",
  responseStyle: "professional",
  answerLength: "balanced",
  layoutDensity: "comfortable",
  indexingNotifications: true,
  activityNotifications: true
};

// =====================================
// LOAD SAVED SETTINGS
// =====================================

const loadSettings = () => {
  try {
    const saved = localStorage.getItem("novatech_settings");

    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : { ...defaultSettings };
  } catch (error) {
    console.error("Unable to load settings:", error);
    return { ...defaultSettings };
  }
};

// =====================================
// FORMAT DATE
// =====================================

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

function App() {
  // =====================================
  // CHAT STATES
  // =====================================

  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState(loadConversations);

  const [selectedConversationId, setSelectedConversationId] =
    useState(() => loadConversations()[0]?.id || null);

  const [loading, setLoading] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState(null);
  const [error, setError] = useState("");

  // =====================================
  // KNOWLEDGE SOURCES STATES
  // =====================================

  const [knowledgeData, setKnowledgeData] = useState({
    total_documents: 0,
    total_chunks: 0,
    documents: []
  });

  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  // =====================================
  // SETTINGS STATES
  // =====================================

  const [settings, setSettings] = useState(loadSettings);

  // =====================================
  // N8N WEBHOOK URLS
  // =====================================

  const CHAT_WEBHOOK_URL =
    "https://n8n.thinkcode.it/webhook/company-knowledge-chat";

  const KNOWLEDGE_SOURCES_URL =
    "https://n8n.thinkcode.it/webhook/knowledge-sources";

  // =====================================
  // SUGGESTED QUESTIONS
  // =====================================

  const suggestions = [
    "What is our company leave policy?",
    "Explain the employee onboarding process",
    "What are our company security guidelines?",
    "Summarize the HR policies"
  ];

  // =====================================
  // CURRENT CONVERSATION
  // =====================================

  const activeConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );

  const messages = activeConversation?.messages || [];

  // =====================================
  // SAVE CONVERSATIONS AUTOMATICALLY
  // =====================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "novatech_conversations",
        JSON.stringify(conversations)
      );
    } catch (error) {
      console.error("Unable to save conversations:", error);
      setError(
        "Unable to save conversation history. Browser storage may be full."
      );
    }
  }, [conversations]);

  // =====================================
  // SAVE SETTINGS AUTOMATICALLY
  // =====================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "novatech_settings",
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Unable to save settings:", error);
    }
  }, [settings]);

  // =====================================
  // UPDATE SETTINGS
  // =====================================

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value
    }));
  };

  // =====================================
  // RESET SETTINGS
  // =====================================

  const resetSettings = () => {
    setSettings({ ...defaultSettings });
  };

  // =====================================
  // FETCH KNOWLEDGE SOURCES FROM N8N
  // =====================================

  const fetchKnowledgeSources = async () => {
    setSourcesLoading(true);
    setSourcesError("");

    try {
      const response = await fetch(KNOWLEDGE_SOURCES_URL, {
        method: "GET"
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      let data = await response.json();

      if (Array.isArray(data)) {
        data = data[0] || {};
      }

      if (data.body && typeof data.body === "string") {
        data = JSON.parse(data.body);
      }

      if (!Array.isArray(data.documents)) {
        throw new Error("Invalid Knowledge Sources API response.");
      }

      setKnowledgeData({
        total_documents: Number(data.total_documents) || 0,
        total_chunks: Number(data.total_chunks) || 0,
        documents: data.documents
      });

    } catch (err) {
      console.error("Knowledge Sources API Error:", err);

      setSourcesError(
        "Unable to load knowledge sources. Please check your n8n workflow and webhook URL."
      );

    } finally {
      setSourcesLoading(false);
    }
  };

  // Load knowledge sources when the application opens
  useEffect(() => {
    fetchKnowledgeSources();
  }, []);

  // =====================================
  // FILTER DOCUMENTS
  // =====================================

  const filteredDocuments = knowledgeData.documents.filter((doc) => {
    const search = documentSearch.toLowerCase();

    return (
      (doc.document_name || "").toLowerCase().includes(search) ||
      (doc.source || "").toLowerCase().includes(search) ||
      (doc.file_id || "").toLowerCase().includes(search)
    );
  });

  // Count distinct document sources
  const totalSources = new Set(
    knowledgeData.documents
      .map((doc) => doc.source)
      .filter(Boolean)
  ).size;

  // =====================================
  // ADD MESSAGE TO A CONVERSATION
  // =====================================

  const addMessage = (conversationId, message) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
            ...conversation,
            messages: [...conversation.messages, message],
            updatedAt: new Date().toISOString()
          }
          : conversation
      )
    );
  };

  // =====================================
  // SEND MESSAGE TO N8N CHATBOT
  // =====================================

  const sendMessage = async (message = question) => {
    if (!message.trim() || loading) return;

    const userQuestion = message.trim();

    const conversationId =
      selectedConversationId ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `conversation-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const existingConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );

    const newUserMessage = {
      id: `message-${Date.now()}-user`,
      role: "user",
      content: userQuestion,
      timestamp: new Date().toISOString()
    };

    if (existingConversation) {
      addMessage(conversationId, newUserMessage);
    } else {
      const newConversation = {
        id: conversationId,
        title:
          userQuestion.length > 42
            ? userQuestion.substring(0, 42) + "..."
            : userQuestion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [newUserMessage]
      };

      setConversations((previous) => [
        newConversation,
        ...previous
      ]);
    }

    setSelectedConversationId(conversationId);
    setQuestion("");
    setError("");
    setLoading(true);
    setLoadingConversationId(conversationId);

    try {
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatInput: userQuestion
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const aiAnswer =
        data.output ||
        data.answer ||
        data.text ||
        data.response ||
        data.message;

      if (!aiAnswer) {
        throw new Error(
          "No AI response received. Check your n8n response configuration."
        );
      }

      const formattedAnswer =
        typeof aiAnswer === "string"
          ? aiAnswer
          : JSON.stringify(aiAnswer, null, 2);

      addMessage(conversationId, {
        id: `message-${Date.now()}-assistant`,
        role: "assistant",
        content: formattedAnswer,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error("n8n Connection Error:", err);

      setError(
        "Unable to connect to the AI assistant. Please check your n8n workflow and try again."
      );

    } finally {
      setLoading(false);
      setLoadingConversationId(null);
    }
  };

  // =====================================
  // START NEW CONVERSATION
  // =====================================

  const newConversation = () => {
    setSelectedConversationId(null);
    setQuestion("");
    setError("");
  };

  // =====================================
  // OPEN PREVIOUS CONVERSATION
  // =====================================

  const openConversation = (id) => {
    setSelectedConversationId(id);
    setQuestion("");
    setError("");
  };

  // =====================================
  // DELETE CONVERSATION
  // =====================================

  const deleteConversation = (id) => {
    const remaining = conversations.filter(
      (conversation) => conversation.id !== id
    );

    setConversations(remaining);

    if (selectedConversationId === id) {
      setSelectedConversationId(remaining[0]?.id || null);
    }

    setError("");
  };

  // =====================================
  // RENDER APPLICATION
  // =====================================

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={23} />
          </div>

          <div>
            <h2>{settings.workspaceName}</h2>
            <span>Knowledge Intelligence</span>
          </div>
        </div>

        <button
          className="new-chat"
          onClick={newConversation}
        >
          <Plus size={18} />
          New Conversation
        </button>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">

          <a className="nav-item active" href="#dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a className="nav-item" href="#chat">
            <MessageSquare size={19} />
            AI Assistant
          </a>

          <a className="nav-item" href="#documents">
            <Files size={19} />
            Knowledge Sources
          </a>

        </nav>

        {/* CONVERSATION HISTORY */}
        <div className="history-section">

          <p className="nav-label">
            <History size={15} />
            RECENT CONVERSATIONS
          </p>

          <div className="history-list">

            {conversations.length === 0 ? (

              <p className="empty-history">
                No conversations yet.
                Start asking your AI assistant!
              </p>

            ) : (

              conversations.map((conversation) => (

                <div
                  key={conversation.id}
                  className={`history-item ${selectedConversationId === conversation.id
                      ? "selected"
                      : ""
                    }`}
                >

                  <button
                    className="history-open"
                    onClick={() => openConversation(conversation.id)}
                    title={conversation.title}
                  >
                    <MessageSquare size={15} />
                    <span>{conversation.title}</span>
                  </button>

                  <button
                    className="history-delete"
                    onClick={() => deleteConversation(conversation.id)}
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={15} />
                  </button>

                </div>

              ))

            )}

          </div>

        </div>

        <p className="nav-label">PREFERENCES</p>

        <nav className="navigation">

          <a className="nav-item" href="#settings">
            <Settings size={19} />
            Settings
          </a>

          <a className="nav-item" href="#help">
            <HelpCircle size={19} />
            Help Center
          </a>

        </nav>

        {/* USER PROFILE */}
        <div className="sidebar-bottom">

          <div className="user-profile">
            <div className="avatar">A</div>

            <div>
              <strong>Admin User</strong>
              <span>Administrator</span>
            </div>
          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className={`main-content ${settings.layoutDensity}`}>

        <header className="topbar">

          <div className="breadcrumb">
            Workspace <span>/</span> Dashboard
          </div>

          <div className="top-actions">

            <button className="icon-button">
              <Bell size={19} />
            </button>

            <div className="top-avatar">A</div>

          </div>

        </header>

        <div className="dashboard-content">

          {/* WELCOME SECTION */}
          <section
            className="welcome-section"
            id="dashboard"
          >

            <div>

              <span className="date-label">
                COMPANY KNOWLEDGE PLATFORM
              </span>

              <h1>Welcome back, Admin 👋</h1>

              <p>{settings.workspaceDescription}</p>

            </div>

            <a className="outline-button" href="#documents">
              <Files size={17} />
              Explore Documents
            </a>

          </section>

          {/* STATISTICS */}
          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon blue">
                <Files size={21} />
              </div>

              <span>Total Documents</span>

              <h2>
                {sourcesLoading
                  ? "..."
                  : knowledgeData.total_documents}
              </h2>

              <small>
                Indexed documents in knowledge base
              </small>

            </div>

            <div className="stat-card">

              <div className="stat-icon purple">
                <MessageSquare size={21} />
              </div>

              <span>AI Conversations</span>

              <h2>{conversations.length}</h2>

              <small>
                Saved conversations
              </small>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                <Database size={21} />
              </div>

              <span>Total Chunks</span>

              <h2>
                {sourcesLoading
                  ? "..."
                  : knowledgeData.total_chunks}
              </h2>

              <small>
                Text chunks stored in Supabase
              </small>

            </div>

            <div className="stat-card">

              <div className="stat-icon orange">
                <Clock size={21} />
              </div>

              <span>Availability</span>

              <h2>24/7</h2>

              <small>
                AI knowledge assistant
              </small>

            </div>

          </section>

          {/* AI ASSISTANT */}
          <section
            className="assistant-section"
            id="chat"
          >

            <div className="assistant-heading">

              <div className="assistant-icon">
                <Sparkles size={22} />
              </div>

              <div>
                <h2>Ask your Knowledge Assistant</h2>

                <p>
                  Find answers from your company's documents
                  in seconds.
                </p>
              </div>

            </div>

            <div className="chat-box">

              {messages.length === 0 && (

                <div className="chat-welcome">

                  <Sparkles size={25} />

                  <h3>How can I help you today?</h3>

                  <p>{settings.welcomeMessage}</p>

                </div>

              )}

              {/* SUGGESTED QUESTIONS */}
              {messages.length === 0 && (

                <div className="suggestion-grid">

                  {suggestions.map((item, index) => (

                    <button
                      key={index}
                      className="suggestion"
                      onClick={() => setQuestion(item)}
                    >
                      {item}
                      <ArrowUpRight size={16} />
                    </button>

                  ))}

                </div>

              )}

              {/* CONVERSATION MESSAGES */}
              {messages.map((message) => (

                <div
                  key={message.id}
                  className={`ai-response ${message.role === "user" ? "user-question" : ""
                    }`}
                >

                  {message.role === "user" ? (

                    <>
                      <strong>You</strong>
                      <p>{message.content}</p>
                    </>

                  ) : (

                    <>
                      <strong>
                        <Sparkles size={17} />
                        {settings.assistantName}
                      </strong>

                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </>

                  )}

                </div>

              ))}

              {/* LOADING INDICATOR */}
              {loading &&
                loadingConversationId === selectedConversationId && (

                  <div className="ai-response">

                    <strong>
                      <Sparkles size={17} />
                      {settings.assistantName}
                    </strong>

                    <p>
                      Thinking... Please wait while I find
                      the answer from your knowledge base.
                    </p>

                  </div>

                )}

              {error && (
                <div className="ai-error">
                  {error}
                </div>
              )}

              {/* CHAT INPUT */}
              <div className="chat-input">

                <input
                  type="text"
                  placeholder="Ask a question about your company..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  disabled={loading}
                />

                <button
                  className="send-button"
                  onClick={() => sendMessage()}
                  disabled={!question.trim() || loading}
                >
                  {loading ? "..." : <Send size={18} />}
                </button>

              </div>

              <p className="input-note">
                <Sparkles size={13} />
                AI-powered answers based on your company
                knowledge base
              </p>

            </div>

          </section>

          {/* KNOWLEDGE BASE OVERVIEW */}
          <section className="recent-section">

            <div className="section-heading">

              <div>
                <h2>Knowledge Base Overview</h2>

                <p>
                  Your centralized company information hub.
                </p>
              </div>

              <a className="view-button" href="#documents">
                View all
                <ArrowUpRight size={16} />
              </a>

            </div>

            <div className="overview-card">

              <div className="overview-icon">
                <FileText size={24} />
              </div>

              <div>
                <h3>Company Documents</h3>

                <p>
                  Your company documents are stored and
                  indexed for AI-powered information retrieval.
                </p>
              </div>

              <div className="status">
                <span></span>
                Knowledge Base
              </div>

            </div>

          </section>

          {/* =====================================
              KNOWLEDGE SOURCES PAGE
          ===================================== */}

          <section
            className="knowledge-sources-section"
            id="documents"
          >

            <div className="sources-heading">

              <div>
                <span className="date-label">
                  DOCUMENT MANAGEMENT
                </span>

                <h2>Knowledge Sources</h2>

                <p>
                  View documents indexed in your company's
                  knowledge base.
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={fetchKnowledgeSources}
                disabled={sourcesLoading}
              >
                <RefreshCw
                  size={16}
                  className={sourcesLoading ? "refresh-spinning" : ""}
                />

                {sourcesLoading ? "Refreshing..." : "Refresh"}
              </button>

            </div>

            {/* SOURCE STATISTICS */}
            <div className="sources-summary">

              <div className="source-summary-card">
                <Files size={20} />

                <div>
                  <strong>{knowledgeData.total_documents}</strong>
                  <span>Indexed Documents</span>
                </div>
              </div>

              <div className="source-summary-card">
                <Database size={20} />

                <div>
                  <strong>{knowledgeData.total_chunks}</strong>
                  <span>Stored Chunks</span>
                </div>
              </div>

              <div className="source-summary-card">
                <BookOpen size={20} />

                <div>
                  <strong>{totalSources}</strong>
                  <span>Document Sources</span>
                </div>
              </div>

            </div>

            {/* DOCUMENT LIBRARY */}
            <div className="document-library">

              <div className="library-heading">

                <div>
                  <h3>Document Library</h3>

                  <p>
                    Documents currently available to the AI assistant.
                  </p>
                </div>

                <div className="document-search">
                  <Search size={17} />

                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                  />
                </div>

              </div>

              {/* LOADING */}
              {sourcesLoading && knowledgeData.documents.length === 0 && (

                <div className="sources-message">
                  <RefreshCw size={22} className="refresh-spinning" />
                  <p>Loading your knowledge sources...</p>
                </div>

              )}

              {/* ERROR */}
              {sourcesError && (

                <div className="sources-error">
                  <p>{sourcesError}</p>

                  <button onClick={fetchKnowledgeSources}>
                    Try Again
                  </button>
                </div>

              )}

              {/* EMPTY DOCUMENT LIST */}
              {!sourcesLoading &&
                !sourcesError &&
                knowledgeData.documents.length === 0 && (

                  <div className="sources-message">
                    <Files size={28} />

                    <h3>No documents found</h3>

                    <p>
                      Your knowledge base does not contain any
                      indexed documents yet.
                    </p>
                  </div>

                )}

              {/* NO SEARCH RESULTS */}
              {!sourcesError &&
                knowledgeData.documents.length > 0 &&
                filteredDocuments.length === 0 && (

                  <div className="sources-message">
                    <Search size={25} />

                    <h3>No matching documents</h3>

                    <p>
                      Try searching with a different document name or source.
                    </p>
                  </div>

                )}

              {/* DOCUMENT TABLE */}
              {filteredDocuments.length > 0 && (

                <div className="document-table-wrapper">

                  <table className="document-table">

                    <thead>
                      <tr>
                        <th>Document Name</th>
                        <th>Source</th>
                        <th>Total Chunks</th>
                        <th>Last Indexed</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredDocuments.map((doc, index) => (

                        <tr key={doc.file_id || index}>

                          <td>
                            <div className="document-name-cell">

                              <div className="document-file-icon">
                                <FileText size={19} />
                              </div>

                              <div>
                                <strong>
                                  {doc.document_name || "Untitled document"}
                                </strong>

                                <small>
                                  {doc.file_id || "No file ID"}
                                </small>
                              </div>

                            </div>
                          </td>

                          <td>
                            <span className="source-label">
                              {doc.source || "Unknown"}
                            </span>
                          </td>

                          <td>
                            <strong className="chunk-count">
                              {doc.total_chunks ?? 0}
                            </strong>
                          </td>

                          <td>
                            {formatDate(doc.last_updated)}
                          </td>

                          <td>
                            <span className="indexed-status">
                              <span></span>
                              Indexed
                            </span>
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

              {/* DOCUMENT COUNT */}
              {filteredDocuments.length > 0 && (

                <div className="library-footer">
                  Showing {filteredDocuments.length} of{" "}
                  {knowledgeData.documents.length} documents
                </div>

              )}

            </div>

          </section>

          {/* =====================================
              SETTINGS PAGE
          ===================================== */}

          <section
            className="settings-section"
            id="settings"
          >

            <div className="settings-heading">

              <div>
                <span className="date-label">
                  WORKSPACE PREFERENCES
                </span>

                <h2>Settings</h2>

                <p>
                  Customize your knowledge platform and assistant preferences.
                </p>
              </div>

              <button
                className="settings-reset-button"
                onClick={resetSettings}
              >
                Reset to Defaults
              </button>

            </div>

            {/* GENERAL SETTINGS */}
            <div className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-icon">
                  <Settings size={20} />
                </div>

                <div>
                  <h3>General Settings</h3>
                  <p>Manage your workspace information.</p>
                </div>

              </div>

              <div className="settings-form-grid">

                <div className="settings-field">
                  <label>Workspace Name</label>

                  <input
                    type="text"
                    value={settings.workspaceName}
                    onChange={(e) =>
                      updateSetting("workspaceName", e.target.value)
                    }
                    placeholder="Enter workspace name"
                  />
                </div>

                <div className="settings-field">
                  <label>Company Name</label>

                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) =>
                      updateSetting("companyName", e.target.value)
                    }
                    placeholder="Enter company name"
                  />
                </div>

                <div className="settings-field full-width">
                  <label>Workspace Description</label>

                  <textarea
                    rows="3"
                    value={settings.workspaceDescription}
                    onChange={(e) =>
                      updateSetting("workspaceDescription", e.target.value)
                    }
                    placeholder="Describe your workspace"
                  />
                </div>

              </div>

            </div>

            {/* AI ASSISTANT SETTINGS */}
            <div className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-icon purple">
                  <Sparkles size={20} />
                </div>

                <div>
                  <h3>AI Assistant Preferences</h3>
                  <p>Customize how your assistant is presented.</p>
                </div>

              </div>

              <div className="settings-form-grid">

                <div className="settings-field">
                  <label>Assistant Name</label>

                  <input
                    type="text"
                    value={settings.assistantName}
                    onChange={(e) =>
                      updateSetting("assistantName", e.target.value)
                    }
                    placeholder="Enter assistant name"
                  />
                </div>

                <div className="settings-field">
                  <label>Response Style</label>

                  <select
                    value={settings.responseStyle}
                    onChange={(e) =>
                      updateSetting("responseStyle", e.target.value)
                    }
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="concise">Concise</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>Answer Length</label>

                  <select
                    value={settings.answerLength}
                    onChange={(e) =>
                      updateSetting("answerLength", e.target.value)
                    }
                  >
                    <option value="short">Short</option>
                    <option value="balanced">Balanced</option>
                    <option value="long">Detailed</option>
                  </select>
                </div>

                <div className="settings-field full-width">
                  <label>Welcome Message</label>

                  <textarea
                    rows="3"
                    value={settings.welcomeMessage}
                    onChange={(e) =>
                      updateSetting("welcomeMessage", e.target.value)
                    }
                    placeholder="Enter the assistant welcome message"
                  />
                </div>

              </div>

              <p className="settings-note">
                Response style and answer length are saved as preferences.
                They will affect AI-generated answers after we connect them to n8n.
              </p>

            </div>

            {/* APPEARANCE SETTINGS */}
            <div className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-icon orange">
                  <BookOpen size={20} />
                </div>

                <div>
                  <h3>Appearance</h3>
                  <p>Adjust the spacing of your workspace.</p>
                </div>

              </div>

              <div className="settings-field">

                <label>Layout Density</label>

                <select
                  value={settings.layoutDensity}
                  onChange={(e) =>
                    updateSetting("layoutDensity", e.target.value)
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>

                <small>
                  Compact mode reduces spacing in the main workspace.
                </small>

              </div>

            </div>

            {/* NOTIFICATION SETTINGS */}
            <div className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-icon green">
                  <Bell size={20} />
                </div>

                <div>
                  <h3>Notifications</h3>
                  <p>Manage your notification preferences.</p>
                </div>

              </div>

              <div className="settings-toggle-row">

                <div>
                  <strong>Document indexing notifications</strong>

                  <p>
                    Receive notifications when document indexing is completed.
                  </p>
                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={settings.indexingNotifications}
                    onChange={(e) =>
                      updateSetting("indexingNotifications", e.target.checked)
                    }
                  />

                  <span className="settings-slider"></span>

                </label>

              </div>

              <div className="settings-toggle-row">

                <div>
                  <strong>Activity notifications</strong>

                  <p>
                    Enable notifications about workspace activity.
                  </p>
                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={settings.activityNotifications}
                    onChange={(e) =>
                      updateSetting("activityNotifications", e.target.checked)
                    }
                  />

                  <span className="settings-slider"></span>

                </label>

              </div>

            </div>

            <div className="settings-saved-message">
              <span></span>
              Your preferences are saved automatically.
            </div>

          </section>

          {/* FOOTER */}
          <footer>
            © 2026 {settings.workspaceName} · Intelligent Knowledge Hub
          </footer>

        </div>

      </main>

    </div>
  );
}

export default App;
