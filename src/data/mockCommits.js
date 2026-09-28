export const mockCommitStream = [
  {
    id: 'cmt-101',
    teamId: 'T-01_BODEGA',
    teamName: 'T-01_BODEGA',
    file: 'src/algorithms/fifo_dispatch.ts',
    message: 'feat: optimización de colas de despacho FIFO para estantería alta',
    scoreDelta: 4,
    tokenDelta: 450,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Algoritmo O(log n) eficiente. Reduce tiempo de búsqueda de picking en 32%.',
    codeSnippet: `// Optimización de Picking FIFO con Heap Binario
export class WarehousePicker {
  private queue: PriorityQueue<Pallet>;
  
  dispatchNextOptimal(dockId: string): Pallet | null {
    const pallet = this.queue.extractMin();
    if (!pallet) return null;
    Telemetry.logDispatch(pallet.sku, dockId);
    return pallet;
  }
}`,
    synergy: null
  },
  {
    id: 'cmt-102',
    teamId: 'T-04_ADUANAS',
    teamName: 'T-04_ADUANAS',
    file: 'api/customs/tariff_validator.py',
    message: 'feat: validador arancelario automático conectado a reglas DIAN',
    scoreDelta: 6,
    tokenDelta: 620,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Validación regex estricta de subpartidas arancelarias. Detecta exenciones tributarias.',
    codeSnippet: `def validate_tariff_code(hs_code: str, origin_country: str) -> dict:
    """Valida aranceles e impuestos de importación en tiempo real"""
    tariff_rule = DIAN_DATABASE.get(hs_code)
    if not tariff_rule:
        return {"status": "FLAGGED", "duty_rate": 0.15}
    return {
        "status": "APPROVED",
        "duty_rate": tariff_rule.preferential_rate if origin_country in TLC_MEMBERS else tariff_rule.base_rate
    }`,
    synergy: {
      teamA: 'T-01_BODEGA',
      teamB: 'T-04_ADUANAS',
      moduleA: 'FIFO_Dispatch',
      moduleB: 'Tariff_Validator',
      description: 'Sinergia crítica: La validación arancelaria de Aduanas puede integrarse directamente en el despacho FIFO de Bodega antes de cargar al muelle.',
      voiceAlert: 'Alerta de Sinergia. Detecto que la validación arancelaria de Aduanas puede integrarse directamente con el despacho de Bodega. Sugiero crear un endpoint REST conjunto.'
    }
  },
  {
    id: 'cmt-103',
    teamId: 'T-07_RUTAS',
    teamName: 'T-07_RUTAS',
    file: 'services/dijkstra_optimizer.js',
    message: 'refactor: matriz de distancias con penalización por tráfico urbano',
    scoreDelta: 7,
    tokenDelta: 890,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Reducción de huella de carbono en 18% mediante desvío dinámico de congestión.',
    codeSnippet: `function calculateOptimalRoute(nodes, trafficWeights) {
  const graph = buildAdjacencyMatrix(nodes, trafficWeights);
  const path = dijkstra(graph, 'PORT_CARTAGENA', 'BODEGA_CENTRAL');
  return {
    waypoints: path.nodes,
    estimatedFuelLiters: path.cost * 0.28,
    etaMinutes: path.cost * 1.4
  };
}`,
    synergy: null
  },
  {
    id: 'cmt-104',
    teamId: 'T-02_COMPRAS',
    teamName: 'T-02_COMPRAS',
    file: 'src/ml/supplier_negotiator.py',
    message: 'fix: corrección en cálculo de descuento por volumen en órdenes de compra',
    scoreDelta: 3,
    tokenDelta: 310,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Lógica matemática corregida. Umbrales de compra escalonada validados.',
    codeSnippet: `def calculate_tier_discount(order_volume: int, base_price: float) -> float:
    tiers = [(1000, 0.12), (500, 0.08), (100, 0.03)]
    for min_qty, discount in tiers:
        if order_volume >= min_qty:
            return base_price * (1.0 - discount)
    return base_price`,
    synergy: null
  },
  {
    id: 'cmt-105',
    teamId: 'T-07_RUTAS',
    teamName: 'T-07_RUTAS',
    file: 'src/telemetry/drone_hub.rs',
    message: 'feat: receptor de telemetría MQTT para enjambre de drones de última milla',
    scoreDelta: 5,
    tokenDelta: 540,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Procesamiento concurrente con Tokio en Rust. Latencia menor a 4ms por paquete.',
    codeSnippet: `pub async fn handle_drone_telemetry(payload: &[u8]) -> Result<DroneState, Error> {
    let telemetry: DronePacket = serde_json::from_slice(payload)?;
    if telemetry.battery_pct < 15.0 {
        emergency_reroute_to_charging_pad(&telemetry.drone_id).await?;
    }
    Ok(telemetry.into())
}`,
    synergy: {
      teamA: 'T-07_RUTAS',
      teamB: 'T-01_BODEGA',
      moduleA: 'Drone_Hub',
      moduleB: 'FIFO_Dispatch',
      description: 'Sinergia detectada: El enjambre de drones de Rutas requiere conectarse al inventario automatizado de Bodega para carga sin intervención humana.',
      voiceAlert: 'Nueva sinergia detectada. El sistema de telemetría de drones de la mesa de Rutas es compatible con la API de despacho de Bodega.'
    }
  }
];
