import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Send
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    title: string;
    summary: string;
    imageUrl: string;
    category?: string;
    url: string;
  };
}

const ShareDialog = ({ open, onOpenChange, post }: ShareDialogProps) => {
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(post.url);
    toast({
      title: "Link copiato! 🎉",
      description: "Il link è stato copiato negli appunti",
      className: "animate-spring-bounce",
    });
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(post.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(post.title + ' - ' + post.url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(post.url)}&text=${encodeURIComponent(post.title)}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-background via-background to-background/95 border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Condividi questo post
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Scegli come vuoi condividere questo contenuto
          </DialogDescription>
        </DialogHeader>

        {/* Post Preview Card */}
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg hover:shadow-2xl transition-all duration-300 group">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            {post.category && (
              <Badge 
                variant="secondary" 
                className="absolute top-3 left-3 backdrop-blur-md bg-primary/20 text-primary border border-primary/50 shadow-lg"
              >
                {post.category}
              </Badge>
            )}
          </div>
          
          <div className="p-4 space-y-2">
            <h3 className="font-bold text-lg line-clamp-2 text-foreground">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.summary}
            </p>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Condividi su:
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-[#1877F2]/10 hover:border-[#1877F2] hover:text-[#1877F2] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-xs font-semibold">Facebook</span>
            </Button>

            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs font-semibold">Twitter / X</span>
            </Button>

            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2] hover:text-[#0A66C2] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-xs font-semibold">LinkedIn</span>
            </Button>

            <Button
              onClick={() => handleShare('whatsapp')}
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-semibold">WhatsApp</span>
            </Button>

            <Button
              onClick={() => handleShare('telegram')}
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-[#0088cc]/10 hover:border-[#0088cc] hover:text-[#0088cc] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
              <span className="text-xs font-semibold">Telegram</span>
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="h-auto py-3 flex-col gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Copy className="w-5 h-5" />
              <span className="text-xs font-semibold">Copia Link</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
