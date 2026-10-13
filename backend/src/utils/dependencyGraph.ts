import { Types } from 'mongoose';
import { BusinessModule } from '../models/BusinessModule.js';
import { ModuleStatus } from '../types/index.js';

export interface CycleCheckResult {
  hasCycle: boolean;
  cyclePath?: string[];
  error?: string;
}

/**
 * Validates dependencies for a target module and ensures the graph remains a DAG (no circular dependencies).
 * Edge definition: A -> B means module A depends on module B.
 * A cycle occurs if any dependency B can reach A through its own dependency chain.
 */
export async function validateModuleDependencies(
  targetModuleId: string,
  proposedDependencyIds: string[]
): Promise<void> {
  const targetIdStr = targetModuleId.toString();

  // 1. Self-dependency check
  if (proposedDependencyIds.some((id) => id.toString() === targetIdStr)) {
    const error: any = new Error('A module cannot depend on itself');
    error.statusCode = 400;
    throw error;
  }

  // 2. Duplicate dependencies check
  const uniqueDeps = new Set(proposedDependencyIds.map((id) => id.toString()));
  if (uniqueDeps.size !== proposedDependencyIds.length) {
    const error: any = new Error('Duplicate dependencies are not allowed');
    error.statusCode = 400;
    throw error;
  }

  if (proposedDependencyIds.length === 0) {
    return;
  }

  // 3. Check all dependencies exist and are not archived
  const objectIds = proposedDependencyIds.map((id) => new Types.ObjectId(id));
  const depModules = await BusinessModule.find({ _id: { $in: objectIds } });

  if (depModules.length !== proposedDependencyIds.length) {
    const foundIds = new Set(depModules.map((m) => m._id.toString()));
    const missing = proposedDependencyIds.filter((id) => !foundIds.has(id.toString()));
    const error: any = new Error(`Referenced module(s) do not exist: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const archived = depModules.filter((m) => m.status === ModuleStatus.ARCHIVED);
  if (archived.length > 0) {
    const names = archived.map((m) => m.name).join(', ');
    const error: any = new Error(`Cannot depend on archived module(s): ${names}`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Graph Cycle Detection:
  // Load all active/inactive modules to construct the dependency adjacency map
  const allModules = await BusinessModule.find(
    { status: { $ne: ModuleStatus.ARCHIVED } },
    '_id name dependencies'
  ).lean();

  const adjList = new Map<string, string[]>();
  const nameMap = new Map<string, string>();

  for (const mod of allModules) {
    const id = mod._id.toString();
    adjList.set(
      id,
      (mod.dependencies || []).map((d: any) => d.toString())
    );
    nameMap.set(id, mod.name);
  }

  // Overlay the proposed dependencies for targetModuleId
  adjList.set(targetIdStr, proposedDependencyIds.map((id) => id.toString()));

  // Target module name
  const targetModule = allModules.find((m) => m._id.toString() === targetIdStr);
  const targetName = targetModule?.name || 'Current Module';
  nameMap.set(targetIdStr, targetName);

  // DFS cycle detection starting from targetModuleId
  const visited = new Set<string>();
  const recursionStack: string[] = [];

  function dfs(currentId: string): string[] | null {
    visited.add(currentId);
    recursionStack.push(currentId);

    const neighbors = adjList.get(currentId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        const cycle = dfs(neighborId);
        if (cycle) return cycle;
      } else if (recursionStack.includes(neighborId)) {
        // Cycle detected!
        const cycleStartIndex = recursionStack.indexOf(neighborId);
        return [...recursionStack.slice(cycleStartIndex), neighborId];
      }
    }

    recursionStack.pop();
    return null;
  }

  const cycle = dfs(targetIdStr);
  if (cycle) {
    const formattedCycle = cycle.map((id) => nameMap.get(id) || id).join(' -> ');
    const error: any = new Error(
      `Circular dependency detected: ${formattedCycle}. Adding this dependency creates a loop.`
    );
    error.statusCode = 400;
    throw error;
  }
}
