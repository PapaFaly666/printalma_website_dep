import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

import mistralAiService, { ChatMessage } from '../../services/mistralAiService';
import { useAuth } from '../../contexts/AuthContext';
import { vendorStatsService, VendorStatsData } from '../../services/vendorStatsService';
import { vendorFundsService, VendorEarnings } from '../../services/vendorFundsService';

const VendorAiSupportPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string>('');
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStatsData | null>(null);
  const [earnings, setEarnings] = useState<VendorEarnings | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Bonjour ! Je suis l'assistant IA pour les vendeurs PrintAlma.

Je peux vous aider à :
• Créer et uploader vos designs
• Positionner correctement vos designs sur les produits
• Comprendre la validation et les bonnes pratiques
• Gérer vos gains et appels de fonds

Posez votre question ou choisissez un sujet suggéré !`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    // Charger le contexte dynamique vendeur
    (async () => {
      try {
        const [s, e] = await Promise.all([
          vendorStatsService.getVendorStats().catch(() => null),
          vendorFundsService.getVendorEarnings().catch(() => null)
        ]);
        setStats(s);
        setEarnings(e);
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSendMessage = async () => {
    if (!currentQuestion.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentQuestion,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setLoading(true);

    try {
      const systemContext = buildSystemContext();
      const response = await mistralAiService.continueChatWithContext([...messages, userMessage], systemContext);

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: `❌ Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const buildSystemContext = () => {
    const lines: string[] = [];
    if (user) {
      lines.push(`Vendeur: ${user.firstName} ${user.lastName} (${user.email})`);
      if ((user as any).vendeur_type) lines.push(`Type: ${(user as any).vendeur_type}`);
    }
    if (stats) {
      lines.push(`Produits: ${stats.totalProducts} total, ${stats.publishedProducts} publiés, ${stats.pendingProducts} en attente`);
      lines.push(`Designs: ${stats.totalDesigns} total, ${stats.validatedDesigns} validés, ${stats.pendingDesigns} en attente`);
      lines.push(`Commandes: ${stats.totalOrders}, Vues boutique: ${stats.shopViews}`);
      lines.push(`CA: Annuel ${stats.yearlyRevenue} F, Mensuel ${stats.monthlyRevenue} F, Solde dispo ${stats.availableBalance} F`);
    }
    if (earnings) {
      lines.push(`Gains: Total ${earnings.totalEarnings} F, En attente ${earnings.pendingAmount} F, Disponible ${earnings.availableAmount} F`);
      lines.push(`Commission moyenne: ${(earnings.averageCommissionRate * 100).toFixed(0)}%`);
    }
    return lines.join('\n');
  };

  const handleSuggestedQuestion = (question: string) => {
    setCurrentQuestion(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(''), 2000);
    } catch (error) {
      // ignore copy errors
    }
  };

  const suggestedQuestions = [
    "Comment créer et uploader un design ?",
    "Comment positionner un design sur un produit ?",
    "Pourquoi mon design est refusé ?",
    "Comment retirer mes gains ?",
    "Comment améliorer mes ventes ?"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-6">
        {/* Header simple */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Assistant IA</h1>
          </div>
          <p className="text-gray-600">Posez vos questions sur PrintAlma</p>
        </div>

        {/* Questions suggérées en haut */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Questions suggérées</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={loading}
                className="text-xs hover:bg-emerald-50 hover:border-emerald-200"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat principal */}
        <Card className="h-[700px] flex flex-col">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Assistant PrintAlma</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                      En ligne
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessages(messages => messages.slice(0, 1))}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Réflexion...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Tapez votre question..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                className="flex-1 rounded-xl"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentQuestion.trim() || loading}
                className="px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VendorAiSupportPage;


