import { ref, computed } from 'vue';

export interface Overlay {
	id?: string;
	name: string;
	author: string;
	version: string;
	source: 'local' | 'repository';
	isInstalled: boolean;
	localPath?: string;
	downloadUrl?: string;
	metadata: {
		usecase: string[];
		compatible: string[];
		resolution: (string | number)[];
		hasSettings: boolean;
		authorLinks: string[];
		notes: string;
	};
}

export function useOverlays() {
	const overlays = ref<Overlay[]>([]);
	const loading = ref(false);
	const searchQuery = ref('');

	const filteredOverlays = computed(() => {
		if (!searchQuery.value) return overlays.value;
		const query = searchQuery.value.toLowerCase();
		return overlays.value.filter(
			(o) => o.name.toLowerCase().includes(query) || o.author.toLowerCase().includes(query),
		);
	});

	const localOverlays = computed(() => overlays.value.filter((o) => o.source === 'local' || o.isInstalled));

	const repositoryOverlays = computed(() => overlays.value.filter((o) => o.source === 'repository'));

	async function fetchOverlays(source: 'local' | 'repository' | 'all' = 'all') {
		loading.value = true;
		try {
			const response = await fetch(`/api/overlays?source=${source}`);
			if (!response.ok) throw new Error('Failed to fetch overlays');
			overlays.value = await response.json();
		} catch (error) {
			console.error('Error fetching overlays:', error);
		} finally {
			loading.value = false;
		}
	}

	async function downloadOverlay(overlay: Overlay) {
		if (!overlay.downloadUrl) return;
		const identifier = overlay.name + ' by ' + overlay.author;

		try {
			const response = await fetch(
				`/api/overlays/${encodeURIComponent(identifier)}/download?url=${encodeURIComponent(overlay.downloadUrl)}`,
				{
					method: 'POST',
				},
			);
			if (!response.ok) throw new Error('Download failed');
			await fetchOverlays('all');
		} catch (error) {
			console.error('Error downloading overlay:', error);
		}
	}

	async function openOverlay(overlay: Overlay) {
		const identifier = overlay.name + ' by ' + overlay.author;
		try {
			await fetch(`/api/overlays/${encodeURIComponent(identifier)}/open`, {
				method: 'POST',
			});
		} catch (error) {
			console.error('Error opening overlay:', error);
		}
	}

	async function deleteOverlay(overlay: Overlay) {
		const identifier = overlay.name + ' by ' + overlay.author;
		try {
			const response = await fetch(`/api/overlays/${encodeURIComponent(identifier)}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Delete failed');
			await fetchOverlays('all');
		} catch (error) {
			console.error('Error deleting overlay:', error);
		}
	}

	return {
		overlays,
		loading,
		searchQuery,
		filteredOverlays,
		localOverlays,
		repositoryOverlays,
		fetchOverlays,
		downloadOverlay,
		openOverlay,
		deleteOverlay,
	};
}
