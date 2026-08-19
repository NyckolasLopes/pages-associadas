export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          ativa: boolean
          created_at: string
          descricao_html: string | null
          id: string
          nome: string
          ordem: number | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          descricao_html?: string | null
          id: string
          nome: string
          ordem?: number | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          descricao_html?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          produto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          produto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          produto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          afe: string | null
          alvara_sanitario: string | null
          ativa: boolean
          cnpj: string
          created_at: string
          crf: string | null
          email: string | null
          endereco: string | null
          faixas_cep: Json
          farmaceutico_responsavel: string | null
          horario_funcionamento: string | null
          id: string
          metodos_pagamento: Json
          nome_fantasia: string
          razao_social: string
          sistema_utilizado: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          afe?: string | null
          alvara_sanitario?: string | null
          ativa?: boolean
          cnpj: string
          created_at?: string
          crf?: string | null
          email?: string | null
          endereco?: string | null
          faixas_cep?: Json
          farmaceutico_responsavel?: string | null
          horario_funcionamento?: string | null
          id: string
          metodos_pagamento?: Json
          nome_fantasia: string
          razao_social: string
          sistema_utilizado?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          afe?: string | null
          alvara_sanitario?: string | null
          ativa?: boolean
          cnpj?: string
          created_at?: string
          crf?: string | null
          email?: string | null
          endereco?: string | null
          faixas_cep?: Json
          farmaceutico_responsavel?: string | null
          horario_funcionamento?: string | null
          id?: string
          metodos_pagamento?: Json
          nome_fantasia?: string
          razao_social?: string
          sistema_utilizado?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          created_at: string
          desconto_unit: number
          id: string
          nome: string
          pedido_id: string
          preco_unit: number
          produto_id: string | null
          qty: number
        }
        Insert: {
          created_at?: string
          desconto_unit?: number
          id?: string
          nome: string
          pedido_id: string
          preco_unit?: number
          produto_id?: string | null
          qty?: number
        }
        Update: {
          created_at?: string
          desconto_unit?: number
          id?: string
          nome?: string
          pedido_id?: string
          preco_unit?: number
          produto_id?: string | null
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cep_entrega: string | null
          created_at: string
          desconto: number
          endereco_entrega: Json | null
          frete: number
          id: string
          loja_id: string | null
          metodo_entrega: string | null
          metodo_pagamento: string | null
          numero: string
          observacoes: string | null
          origem: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cep_entrega?: string | null
          created_at?: string
          desconto?: number
          endereco_entrega?: Json | null
          frete?: number
          id?: string
          loja_id?: string | null
          metodo_entrega?: string | null
          metodo_pagamento?: string | null
          numero?: string
          observacoes?: string | null
          origem?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cep_entrega?: string | null
          created_at?: string
          desconto?: number
          endereco_entrega?: Json | null
          frete?: number
          id?: string
          loja_id?: string | null
          metodo_entrega?: string | null
          metodo_pagamento?: string | null
          numero?: string
          observacoes?: string | null
          origem?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_precos_loja: {
        Row: {
          ativo: boolean
          created_at: string
          estoque: number
          id: string
          loja_id: string
          preco_de: number | null
          preco_por: number | null
          produto_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          estoque?: number
          id?: string
          loja_id: string
          preco_de?: number | null
          preco_por?: number | null
          produto_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          estoque?: number
          id?: string
          loja_id?: string
          preco_de?: number | null
          preco_por?: number | null
          produto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_precos_loja_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_precos_loja_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          campanha_fim: string | null
          campanha_inicio: string | null
          categoria_id: string | null
          categorias_adicionais: Json | null
          classe_terapeutica: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          ean: string | null
          em_campanha: boolean
          estoque: number
          generico: boolean
          id: string
          imagens: Json | null
          indicacao_terapeutica: string | null
          internal_tags: Json | null
          marca: string | null
          nome: string
          possui_imagem: boolean
          preco_campanha: number | null
          preco_custo: number | null
          preco_de: number
          preco_por: number
          principios_ativos: Json | null
          registro_anvisa: string | null
          retem_receita: boolean
          tipo_de_receita: string | null
          slug: string
          subcategoria_id: string | null
          tarja: string | null
          tipo_medicamento: string | null
          updated_at: string
          video_url: string | null
          eans_secundarios: Json | null
          codigo_interno: string | null
          tipo_produto: string | null
          produto_natureza: string | null
          ncm: string | null
          subcategorias_adicionais: Json | null
          prioridade: number | null
          lancamento: boolean | null
          caracteristicas: Json | null
          faixa_etaria: string | null
          titulo_seo: string | null
          meta_description: string | null
        }
        Insert: {
          ativo?: boolean
          campanha_fim?: string | null
          campanha_inicio?: string | null
          categoria_id?: string | null
          categorias_adicionais?: Json | null
          classe_terapeutica?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          ean?: string | null
          em_campanha?: boolean
          estoque?: number
          generico?: boolean
          id: string
          imagens?: Json | null
          indicacao_terapeutica?: string | null
          internal_tags?: Json | null
          marca?: string | null
          nome: string
          possui_imagem?: boolean
          preco_campanha?: number | null
          preco_custo?: number | null
          preco_de?: number
          preco_por?: number
          principios_ativos?: Json | null
          registro_anvisa?: string | null
          retem_receita?: boolean
          tipo_de_receita?: string | null
          slug: string
          subcategoria_id?: string | null
          tarja?: string | null
          tipo_medicamento?: string | null
          updated_at?: string
          video_url?: string | null
          eans_secundarios?: Json | null
          codigo_interno?: string | null
          tipo_produto?: string | null
          produto_natureza?: string | null
          ncm?: string | null
          subcategorias_adicionais?: Json | null
          prioridade?: number | null
          lancamento?: boolean | null
          tipo_receita?: string | null
          caracteristicas?: Json | null
          faixa_etaria?: string | null
          titulo_seo?: string | null
          meta_description?: string | null
        }
        Update: {
          ativo?: boolean
          campanha_fim?: string | null
          campanha_inicio?: string | null
          categoria_id?: string | null
          categorias_adicionais?: Json | null
          classe_terapeutica?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          ean?: string | null
          em_campanha?: boolean
          estoque?: number
          generico?: boolean
          id?: string
          imagens?: Json | null
          indicacao_terapeutica?: string | null
          internal_tags?: Json | null
          marca?: string | null
          nome?: string
          possui_imagem?: boolean
          preco_campanha?: number | null
          preco_custo?: number | null
          preco_de?: number
          preco_por?: number
          principios_ativos?: Json | null
          registro_anvisa?: string | null
          retem_receita?: boolean
          tipo_de_receita?: string | null
          slug?: string
          subcategoria_id?: string | null
          tarja?: string | null
          tipo_medicamento?: string | null
          updated_at?: string
          video_url?: string | null
          eans_secundarios?: Json | null
          codigo_interno?: string | null
          tipo_produto?: string | null
          produto_natureza?: string | null
          ncm?: string | null
          subcategorias_adicionais?: Json | null
          prioridade?: number | null
          lancamento?: boolean | null
          tipo_receita?: string | null
          caracteristicas?: Json | null
          faixa_etaria?: string | null
          titulo_seo?: string | null
          meta_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_acessos: {
        Row: {
          created_at: string
          id: string
          loja_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          loja_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          loja_id?: string | null
          session_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
export const Constants = {
  public: {
    Enums: {},
  },
} as const
