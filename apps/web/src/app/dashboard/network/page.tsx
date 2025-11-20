'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createApiClient } from '@/lib/api-client';
import { Users, Network, ZoomIn, ZoomOut, Maximize2, Star } from 'lucide-react';

interface NetworkNode {
  id: string;
  type: 'user' | 'contact';
  name: string;
  email?: string;
  company?: string;
  avatarUrl?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  type: 'view' | 'mutual' | 'contact';
  strength: number;
  viewCount?: number;
}

interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export default function NetworkPage() {
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    loadNetworkData();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadNetworkData = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get('/connections/network-graph') as NetworkGraphData;
      initializeNodePositions(data);
      setGraphData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load network data:', error);
      setLoading(false);
    }
  };

  const initializeNodePositions = (data: NetworkGraphData) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    data.nodes.forEach((node, index) => {
      if (node.type === 'user' && node.name === 'You') {
        node.x = centerX;
        node.y = centerY;
      } else {
        const angle = (index * 2 * Math.PI) / (data.nodes.length - 1);
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      }
      node.vx = 0;
      node.vy = 0;
    });
  };

  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      applyForces();
      draw(ctx, canvas.width, canvas.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, zoom]);

  const applyForces = () => {
    if (!graphData) return;

    const repulsionStrength = 2000;
    const attractionStrength = 0.01;
    const damping = 0.8;

    graphData.nodes.forEach((node1, i) => {
      if (node1.type === 'user' && node1.name === 'You') return;

      let fx = 0;
      let fy = 0;

      graphData.nodes.forEach((node2, j) => {
        if (i === j) return;
        const dx = node2.x! - node1.x!;
        const dy = node2.y! - node1.y!;
        const distSq = dx * dx + dy * dy + 0.1;
        const dist = Math.sqrt(distSq);

        fx -= (repulsionStrength * dx) / distSq;
        fy -= (repulsionStrength * dy) / distSq;
      });

      graphData.edges.forEach((edge) => {
        if (edge.source === node1.id || edge.target === node1.id) {
          const other = graphData.nodes.find(
            (n) => n.id === (edge.source === node1.id ? edge.target : edge.source)
          );
          if (other) {
            const dx = other.x! - node1.x!;
            const dy = other.y! - node1.y!;
            fx += dx * attractionStrength;
            fy += dy * attractionStrength;
          }
        }
      });

      node1.vx = (node1.vx! + fx) * damping;
      node1.vy = (node1.vy! + fy) * damping;
      node1.x! += node1.vx!;
      node1.y! += node1.vy!;

      node1.x = Math.max(50, Math.min(750, node1.x!));
      node1.y = Math.max(50, Math.min(550, node1.y!));
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!graphData) return;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(zoom, zoom);

    graphData.edges.forEach((edge) => {
      const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
      const targetNode = graphData.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x!, sourceNode.y!);
        ctx.lineTo(targetNode.x!, targetNode.y!);

        if (edge.type === 'mutual') {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }
    });

    graphData.nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, node.type === 'user' && node.name === 'You' ? 15 : 10, 0, 2 * Math.PI);

      if (node.type === 'user' && node.name === 'You') {
        ctx.fillStyle = '#3b82f6';
      } else {
        ctx.fillStyle = node.type === 'user' ? '#6366f1' : '#8b5cf6';
      }
      ctx.fill();

      if (selectedNode && selectedNode.id === node.id) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name.substring(0, 20), node.x!, node.y! + 25);
    });

    ctx.restore();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const clickedNode = graphData.nodes.find((node) => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 15;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    if (graphData) {
      initializeNodePositions(graphData);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Network className="h-8 w-8" />
          Network Graph
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize your professional network and connection strength
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Network Visualization</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Click on nodes to see details. Green lines indicate mutual connections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="border rounded-lg cursor-pointer bg-white"
                onClick={handleCanvasClick}
              />
              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">You</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                  <span className="text-sm">Connections</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span className="text-sm">Mutual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-gray-400"></div>
                  <span className="text-sm">One-way</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedNode ? 'Connection Details' : 'Network Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                    {selectedNode.email && (
                      <p className="text-sm text-muted-foreground">{selectedNode.email}</p>
                    )}
                    {selectedNode.company && (
                      <p className="text-sm text-muted-foreground">{selectedNode.company}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={selectedNode.type === 'user' ? 'default' : 'secondary'}>
                      {selectedNode.type === 'user' ? <Users className="h-3 w-3 mr-1" /> : null}
                      {selectedNode.type}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Connections</span>
                    <span className="font-semibold">{graphData?.nodes.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mutual Connections</span>
                    <span className="font-semibold text-green-600">
                      {graphData?.edges.filter((e) => e.type === 'mutual').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Interactions</span>
                    <span className="font-semibold">
                      {graphData?.edges.reduce((sum, e) => sum + (e.viewCount || 0), 0) || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Click on a node to see connection details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
