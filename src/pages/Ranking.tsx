import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, TrendingUp, Star } from "lucide-react";

interface RankingStudent {
  id: string;
  rank_position: number;
  average_grade: number;
  total_attendance_rate: number;
  points: number;
  student: {
    id: string;
    user_id: string;
    student_number: string | null;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
    class: {
      name: string;
    } | null;
  };
}

export default function Ranking() {
  const { user, role } = useAuth();

  const { data: rankings, isLoading } = useQuery({
    queryKey: ["student-rankings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_rankings")
        .select(`
          *,
          student:students!inner(
            id,
            user_id,
            student_number,
            profile:profiles!inner(full_name, avatar_url),
            class:classes(name)
          )
        `)
        .order("rank_position", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as unknown as RankingStudent[];
    },
  });

  const { data: myRanking } = useQuery({
    queryKey: ["my-ranking", user?.id],
    queryFn: async () => {
      if (!user || role !== "aluno") return null;
      
      // Get student record
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!student) return null;

      const { data, error } = await supabase
        .from("student_rankings")
        .select("*")
        .eq("student_id", student.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && role === "aluno",
  });

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Badge className="bg-yellow-500 text-black">1º Lugar</Badge>;
      case 2:
        return <Badge className="bg-gray-400 text-black">2º Lugar</Badge>;
      case 3:
        return <Badge className="bg-amber-600 text-white">3º Lugar</Badge>;
      default:
        return <Badge variant="secondary">{position}º</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Ranking de Alunos
        </h1>
        <p className="text-muted-foreground">
          Classificação dos melhores alunos por desempenho académico
        </p>
      </div>

      {/* My Position Card (for students) */}
      {role === "aluno" && myRanking && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              A Minha Posição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getRankIcon(myRanking.rank_position || 0)}
                <div>
                  <p className="text-2xl font-bold">{myRanking.rank_position || "-"}º Lugar</p>
                  <p className="text-muted-foreground">
                    Média: {myRanking.average_grade?.toFixed(1) || "-"} | 
                    Assiduidade: {myRanking.total_attendance_rate?.toFixed(0) || "-"}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{myRanking.points || 0}</p>
                <p className="text-sm text-muted-foreground">Pontos</p>
              </div>
            </div>
            {myRanking.rank_position && myRanking.rank_position > 1 && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  💡 <strong>Dica:</strong> Para subir no ranking, mantenha boas notas e uma alta taxa de assiduidade!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 100 Alunos</CardTitle>
          <CardDescription>Classificação baseada em média de notas e assiduidade</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : rankings && rankings.length > 0 ? (
            <div className="space-y-2">
              {rankings.map((ranking, index) => (
                <div
                  key={ranking.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    ranking.student?.user_id === user?.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  } ${index < 3 ? "bg-gradient-to-r from-transparent to-muted/30" : ""}`}
                >
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(ranking.rank_position)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {ranking.student?.profile?.full_name || "Aluno"}
                      </p>
                      {ranking.rank_position <= 3 && getRankBadge(ranking.rank_position)}
                      {ranking.student?.user_id === user?.id && (
                        <Badge variant="outline">Você</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ranking.student?.class?.name || "Sem turma"} 
                      {ranking.student?.student_number && ` • Nº ${ranking.student.student_number}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{ranking.average_grade?.toFixed(1) || "-"}</p>
                    <p className="text-xs text-muted-foreground">Média</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{ranking.total_attendance_rate?.toFixed(0) || "-"}%</p>
                    <p className="text-xs text-muted-foreground">Assiduidade</p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="font-bold text-primary">{ranking.points || 0}</p>
                    <p className="text-xs text-muted-foreground">Pts</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum ranking disponível ainda.</p>
              <p className="text-sm">O ranking será atualizado com base no desempenho dos alunos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}