export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dividend: {
        Row: {
          amount_shares: number
          created_at: string | null
          dividendValue: number
          dividendYield: number
          id: string
          payDate: string
          portfolio_id: string
          ticker: string
          totalAmount: number
          year: number
        }
        Insert: {
          amount_shares: number
          created_at?: string | null
          dividendValue: number
          dividendYield: number
          id?: string
          payDate: string
          portfolio_id: string
          ticker: string
          totalAmount: number
          year: number
        }
        Update: {
          amount_shares?: number
          created_at?: string | null
          dividendValue?: number
          dividendYield?: number
          id?: string
          payDate?: string
          portfolio_id?: string
          ticker?: string
          totalAmount?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividend_portfolio_id_fkey"
            columns: ["portfolio_id"]
            referencedRelation: "portfolio"
            referencedColumns: ["id"]
          }
        ]
      }
      dividend_in_month: {
        Row: {
          April: number | null
          August: number | null
          created_at: string | null
          December: number | null
          February: number | null
          id: string
          January: number | null
          July: number | null
          June: number | null
          March: number | null
          May: number | null
          November: number | null
          October: number | null
          September: number | null
          year: number
        }
        Insert: {
          April?: number | null
          August?: number | null
          created_at?: string | null
          December?: number | null
          February?: number | null
          id?: string
          January?: number | null
          July?: number | null
          June?: number | null
          March?: number | null
          May?: number | null
          November?: number | null
          October?: number | null
          September?: number | null
          year: number
        }
        Update: {
          April?: number | null
          August?: number | null
          created_at?: string | null
          December?: number | null
          February?: number | null
          id?: string
          January?: number | null
          July?: number | null
          June?: number | null
          March?: number | null
          May?: number | null
          November?: number | null
          October?: number | null
          September?: number | null
          year?: number
        }
        Relationships: []
      }
      exit: {
        Row: {
          average_price_per_share: number
          cost: number
          created_at: string
          finish_date: string
          id: string
          portfolio_id: string
          profit_margin: number
          profit_value: number
          return: number
          start_date: string
          ticker: string
        }
        Insert: {
          average_price_per_share: number
          cost: number
          created_at?: string
          finish_date: string
          id?: string
          portfolio_id: string
          profit_margin: number
          profit_value: number
          return: number
          start_date: string
          ticker: string
        }
        Update: {
          average_price_per_share?: number
          cost?: number
          created_at?: string
          finish_date?: string
          id?: string
          portfolio_id?: string
          profit_margin?: number
          profit_value?: number
          return?: number
          start_date?: string
          ticker?: string
        }
        Relationships: []
      }
      index: {
        Row: {
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          cost: number
          created_at: string
          gain_margin: number
          gain_value: number
          id: string
          title: string
          user_id: string
          value: number
        }
        Insert: {
          cost?: number
          created_at?: string
          gain_margin?: number
          gain_value?: number
          id?: string
          title: string
          user_id: string
          value?: number
        }
        Update: {
          cost?: number
          created_at?: string
          gain_margin?: number
          gain_value?: number
          id?: string
          title?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      screener: {
        Row: {
          analyst: string | null
          created_at: string
          de: string | null
          dividend_yield: string | null
          id: string
          industry: string | null
          margin_safety: string | null
          payout_ratio: string | null
          pe: string | null
          priceGrowth: string | null
          roe: string | null
          sector: string | null
          title: string
          user_id: string
        }
        Insert: {
          analyst?: string | null
          created_at?: string
          de?: string | null
          dividend_yield?: string | null
          id?: string
          industry?: string | null
          margin_safety?: string | null
          payout_ratio?: string | null
          pe?: string | null
          priceGrowth?: string | null
          roe?: string | null
          sector?: string | null
          title: string
          user_id: string
        }
        Update: {
          analyst?: string | null
          created_at?: string
          de?: string | null
          dividend_yield?: string | null
          id?: string
          industry?: string | null
          margin_safety?: string | null
          payout_ratio?: string | null
          pe?: string | null
          priceGrowth?: string | null
          roe?: string | null
          sector?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screener_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
        ]
      }
      stock: {
        Row: {
          analystRatingBuy: number | null
          annualDividend: number | null
          beta: number | null
          created_at: string | null
          de: number | null
          dividendYield: number | null
          eps_growth_past_5y: number | null
          exchange: string
          gfValue: number | null
          gfValueMargin: number | null
          gross_margin: number | null
          id: string
          index: string | null
          isDividendAristocrat: boolean
          isDividendKing: boolean
          marketCap: number | null
          name: string | null
          net_margin: number | null
          payoutRation: number | null
          pe: number | null
          price_current: number | null
          price_growth: number | null
          price_target: number | null
          price_year_high: number | null
          report_date: string | null
          roe: number | null
          sector: string
          subIndustry: string
          ticker: string
        }
        Insert: {
          analystRatingBuy?: number | null
          annualDividend?: number | null
          beta?: number | null
          created_at?: string | null
          de?: number | null
          dividendYield?: number | null
          eps_growth_past_5y?: number | null
          exchange: string
          gfValue?: number | null
          gfValueMargin?: number | null
          gross_margin?: number | null
          id?: string
          index?: string | null
          isDividendAristocrat?: boolean
          isDividendKing?: boolean
          marketCap?: number | null
          name?: string | null
          net_margin?: number | null
          payoutRation?: number | null
          pe?: number | null
          price_current?: number | null
          price_growth?: number | null
          price_target?: number | null
          price_year_high?: number | null
          report_date?: string | null
          roe?: number | null
          sector: string
          subIndustry: string
          ticker: string
        }
        Update: {
          analystRatingBuy?: number | null
          annualDividend?: number | null
          beta?: number | null
          created_at?: string | null
          de?: number | null
          dividendYield?: number | null
          eps_growth_past_5y?: number | null
          exchange?: string
          gfValue?: number | null
          gfValueMargin?: number | null
          gross_margin?: number | null
          id?: string
          index?: string | null
          isDividendAristocrat?: boolean
          isDividendKing?: boolean
          marketCap?: number | null
          name?: string | null
          net_margin?: number | null
          payoutRation?: number | null
          pe?: number | null
          price_current?: number | null
          price_growth?: number | null
          price_target?: number | null
          price_year_high?: number | null
          report_date?: string | null
          roe?: number | null
          sector?: string
          subIndustry?: string
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_index_fkey"
            columns: ["index"]
            referencedRelation: "index"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_portfolio: {
        Row: {
          amount_active_shares: number | null
          average_cost_per_share: number | null
          created_at: string | null
          dividend_upcoming_date: string | null
          dividend_upcoming_value: number | null
          exchange: string
          gain_margin: number | null
          gain_value: number | null
          id: string
          is_dividend: boolean
          is_trading: boolean | null
          last_change_portfolio: string | null
          lastDividendPayDate: string | null
          perc_of_portfolio: number
          portfolio_id: string
          price_current: number
          price_growth: number | null
          price_target: number | null
          startTradeDate: string | null
          ticker: string
          total_dividend_income: number | null
          total_return_margin: number | null
          total_return_value: number | null
        }
        Insert: {
          amount_active_shares?: number | null
          average_cost_per_share?: number | null
          created_at?: string | null
          dividend_upcoming_date?: string | null
          dividend_upcoming_value?: number | null
          exchange: string
          gain_margin?: number | null
          gain_value?: number | null
          id?: string
          is_dividend?: boolean
          is_trading?: boolean | null
          last_change_portfolio?: string | null
          lastDividendPayDate?: string | null
          perc_of_portfolio?: number
          portfolio_id: string
          price_current: number
          price_growth?: number | null
          price_target?: number | null
          startTradeDate?: string | null
          ticker: string
          total_dividend_income?: number | null
          total_return_margin?: number | null
          total_return_value?: number | null
        }
        Update: {
          amount_active_shares?: number | null
          average_cost_per_share?: number | null
          created_at?: string | null
          dividend_upcoming_date?: string | null
          dividend_upcoming_value?: number | null
          exchange?: string
          gain_margin?: number | null
          gain_value?: number | null
          id?: string
          is_dividend?: boolean
          is_trading?: boolean | null
          last_change_portfolio?: string | null
          lastDividendPayDate?: string | null
          perc_of_portfolio?: number
          portfolio_id?: string
          price_current?: number
          price_growth?: number | null
          price_target?: number | null
          startTradeDate?: string | null
          ticker?: string
          total_dividend_income?: number | null
          total_return_margin?: number | null
          total_return_value?: number | null
        }
        Relationships: []
      }
      transaction: {
        Row: {
          change: string
          count: number
          created_at: string | null
          date: string
          id: string
          portfolio_id: string
          price: number
          ticker: string
          type: string
        }
        Insert: {
          change: string
          count: number
          created_at?: string | null
          date: string
          id?: string
          portfolio_id: string
          price: number
          ticker: string
          type: string
        }
        Update: {
          change?: string
          count?: number
          created_at?: string | null
          date?: string
          id?: string
          portfolio_id?: string
          price?: number
          ticker?: string
          type?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          balance: number
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          email?: string
          id?: string
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
