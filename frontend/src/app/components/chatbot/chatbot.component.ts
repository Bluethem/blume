import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ApiResponse {
  success: boolean;
  data?: {
    respuesta: string;
    timestamp: string;
  };
  message?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private shouldScroll = false;

  isOpen = false;
  messages: ChatMessage[] = [];
  inputMessage = '';
  loading = false;

  ngOnInit(): void {
    // Mensaje de bienvenida inicial
    this.messages.push({
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asistente virtual de Blume. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
    }
  }

  enviarMensaje(event: Event): void {
    event.preventDefault();
    
    if (!this.inputMessage.trim() || this.loading) return;

    // Agregar mensaje del usuario
    this.messages.push({
      role: 'user',
      content: this.inputMessage,
      timestamp: new Date()
    });

    const mensaje = this.inputMessage;
    this.inputMessage = '';
    this.loading = true;
    this.shouldScroll = true;

    // Llamar al backend
    this.http.post<ApiResponse>(`${this.apiUrl}/chatbot/message`, { message: mensaje })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.messages.push({
              role: 'assistant',
              content: response.data.respuesta,
              timestamp: new Date()
            });
          } else {
            this.agregarMensajeError();
          }
          this.loading = false;
          this.shouldScroll = true;
        },
        error: (error) => {
          console.error('Error en chatbot:', error);
          
          // Mensaje de error personalizado según el código
          let mensajeError = 'Lo siento, hubo un error. Por favor intenta de nuevo.';
          
          if (error.status === 429) {
            mensajeError = '⚠️ Has enviado muchos mensajes. Por favor espera un momento antes de continuar.';
          } else if (error.status === 401) {
            mensajeError = '🔒 Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
          }
          
          this.messages.push({
            role: 'assistant',
            content: mensajeError,
            timestamp: new Date()
          });
          
          this.loading = false;
          this.shouldScroll = true;
        }
      });
  }

  private agregarMensajeError(): void {
    this.messages.push({
      role: 'assistant',
      content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
      timestamp: new Date()
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  limpiarChat(): void {
    this.messages = [{
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asistente virtual de Blume. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }];
    this.shouldScroll = true;
  }
}
