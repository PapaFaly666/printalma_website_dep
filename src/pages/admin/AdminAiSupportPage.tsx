import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Lightbulb,
  HelpCircle,
  Zap,
  Copy,
  Check,
  AlertTriangle,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

import mistralAiService, { ChatMessage, AiSupportResponse } from '../../services/mistralAiService';

const AdminAiSupportPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ajouter un message d'accueil
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Bonjour ! Je suis votre assistant IA spécialisé pour PrintAlma.

Je peux vous aider à :
• Guider les vendeurs dans l'utilisation de la plateforme
• Expliquer les processus de validation de designs
• Résoudre les problèmes techniques courants
• Optimiser l'expérience vendeur

Posez-moi une question ou choisissez un sujet suggéré ci-dessous !`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
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
      const response = await mistralAiService.continueChat([...messages, userMessage]);

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
        content: `❌ Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants.\n\nErreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
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
      console.error('Erreur lors de la copie:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentQuestion('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const suggestedQuestions = mistralAiService.getSuggestedQuestions();
  const commonIssues = mistralAiService.getCommonIssues();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col gap-6 p-4 md:p-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Assistant IA - Support Vendeurs</h1>
              <p className="text-gray-600 mt-1">Obtenez de l'aide pour guider et supporter vos vendeurs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Nouveau chat
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Panel de suggestions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Questions suggérées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Questions suggérées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.slice(0, 5).map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-3 text-xs"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={loading}
                  >
                    <HelpCircle className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-2">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Problèmes courants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Problèmes courants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {commonIssues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-700">{issue.title}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-2 text-xs text-gray-600"
                      onClick={() => handleSuggestedQuestion(issue.question)}
                      disabled={loading}
                    >
                      <Zap className="mr-2 h-3 w-3 flex-shrink-0" />
                      Obtenir de l'aide
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Zone de chat principale */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Assistant PrintAlma</CardTitle>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      En ligne
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    Propulsé par Mistral AI
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Zone des messages */}
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
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        <div className={`rounded-2xl p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <div className={`text-xs ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {formatTime(message.timestamp)}
                            </div>
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-200"
                                onClick={() => copyToClipboard(message.content, message.id)}
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-500" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
                          <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <Separator />

              {/* Zone de saisie */}
              <div className="p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Tapez votre question sur PrintAlma..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentQuestion.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Astuce: Soyez précis dans vos questions pour obtenir des réponses plus utiles
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAiSupportPage;