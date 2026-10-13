"""Offline coverage of the public Nuvio JSON and referenced PNG assets."""
import hashlib
import json
from pathlib import Path
import re
import struct
import unittest


ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "badges.json").read_text(encoding="utf-8"))


def matched(text, group=None):
    return {entry["id"] for entry in DATA["filters"]
            if entry["isEnabled"] and (group is None or entry["groupId"] == group)
            and re.search(entry["pattern"], text)}


class BadgesTest(unittest.TestCase):
    def test_schema_patterns_and_local_image_urls(self):
        ids = [entry["id"] for entry in DATA["filters"]]
        self.assertEqual(len(ids), len(set(ids)))
        groups = {group["id"] for group in DATA["groups"]}
        prefix = "https://raw.githubusercontent.com/HeliumMarcos/L1-Badges/main/"
        for entry in DATA["filters"]:
            with self.subTest(id=entry["id"]):
                self.assertIn(entry["groupId"], groups)
                re.compile(entry["pattern"])
                self.assertTrue(entry["imageURL"].startswith(prefix))
                image = ROOT / entry["imageURL"].removeprefix(prefix)
                self.assertTrue(image.is_file(), f"Missing {image.name}")
                content = image.read_bytes()
                self.assertEqual(content[:8], b"\x89PNG\r\n\x1a\n")
                width, height = struct.unpack(">II", content[16:24])
                self.assertGreater(width, 0)
                self.assertGreater(height, 0)

    def test_exact_huntsman_file_and_nuvio_display(self):
        filename = "O Caçador e a Rainha do Gelo (2016) 2160p BluRay Remux HDR10 DTS-HD.HR7.1 H.265 tt2381991.mkv"
        title = "🎬 O Caçador e a Rainha do Gelo - (2016)\n💎 2160p HDR10   🔊 DTS-HD HR 7.1\n💿 Blu-ray REMUX   ⚙️ H.265   💾 11.5GB"
        expected = {"remux", "blu-ray-disc", "4k-ultra-hd", "hdr10", "dts-hd-high-resolution", "71-audio", "hevc"}
        for candidate in (filename, title, filename + " " + title):
            with self.subTest(candidate=candidate):
                self.assertEqual(matched(candidate), expected)

    def test_codec_and_layout_are_recognized_when_joined(self):
        samples = [
            ("AAC2.0", "aac", "20-audio"), ("DD5.1", "dolby-digital", "51-audio"),
            ("DDP5.1", "dolby-digital-plus", "51-audio"), ("DD+7.1", "dolby-digital-plus", "71-audio"),
            ("E-AC-3 5.1", "dolby-digital-plus", "51-audio"),
            ("TrueHD7.1", "truehd", "71-audio"), ("DTS6.1", "dts", "61-audio"),
            ("DTS-HD.HR7.1", "dts-hd-high-resolution", "71-audio"),
            ("DTS-HD HRA7.1", "dts-hd-high-resolution", "71-audio"),
            ("DTS-HD.MA7.1", "dts-hd-master-audio", "71-audio"),
            ("DTSHDMA7.1", "dts-hd-master-audio", "71-audio"),
            ("DTS-HD7.1", "dts-hd", "71-audio"),
            ("FLAC2.0", "flac", "20-audio"), ("PCM5.1", "pcm", "51-audio"),
            ("LPCM5.1", "pcm", "51-audio"), ("Opus2.0", "opus", "20-audio"),
            ("MP32.0", "mp3", "20-audio"), ("Vorbis2.0", "vorbis", "20-audio"),
        ]
        for tag, audio, channels in samples:
            with self.subTest(tag=tag):
                text = f"Filme (2026) 2160p WEB-DL {tag} H.265.mkv"
                self.assertEqual(matched(text, "audio-tech"), {audio})
                self.assertEqual(matched(text, "audio-channels"), {channels})

    def test_layouts_are_complete_not_shortened_or_guessed(self):
        for layout in ("1.0", "2.0", "2.1", "3.0", "4.0", "4.1", "5.0", "5.1", "6.0", "6.1", "7.1", "5.1.2", "7.1.4"):
            with self.subTest(layout=layout):
                self.assertEqual(matched(f"TrueHD{layout}", "audio-channels"), {layout.replace(".", "") + "-audio"})
                self.assertNotIn("dolby-atmos", matched(f"TrueHD{layout}"))
        self.assertEqual(matched("PCM10ch", "audio-channels"), {"10ch-audio"})
        self.assertEqual(matched("PCM8ch", "audio-channels"), {"other-channel-count"})
        self.assertEqual(matched("PCM6ch", "audio-channels"), {"other-channel-count"})

    def test_immersive_and_vision_are_independent_badges(self):
        self.assertEqual(matched("TrueHD7.1 Atmos", "audio-tech"), {"truehd", "dolby-atmos"})
        self.assertEqual(matched("DDP5.1 Atmos DV"), {"dolby-vision", "dolby-digital-plus", "dolby-atmos", "51-audio"})
        self.assertEqual(matched("TrueHD7.1 DV"), {"dolby-vision", "truehd", "71-audio"})
        self.assertEqual(matched("DTS-HD.MA7.1 DTS-X", "audio-tech"), {"dts-hd-master-audio", "dts-x"})
        self.assertEqual(matched("DTS-HD.HR7.1 DTS:X", "audio-tech"), {"dts-hd-high-resolution", "dts-x"})

    def test_dolby_variants_never_activate_combined_badges(self):
        codecs = [
            ("DD5.1", "dolby-digital", "51-audio"),
            ("AC-3 5.1", "dolby-digital", "51-audio"),
            ("Dolby Digital 5.1", "dolby-digital", "51-audio"),
            ("DDP5.1", "dolby-digital-plus", "51-audio"),
            ("DD+7.1", "dolby-digital-plus", "71-audio"),
            ("E-AC-3 5.1", "dolby-digital-plus", "51-audio"),
            ("Dolby Digital Plus 5.1", "dolby-digital-plus", "51-audio"),
            ("TrueHD7.1", "truehd", "71-audio"),
            ("Dolby TrueHD 7.1", "truehd", "71-audio"),
        ]
        for vision in ("DV", "DoVi", "Dolby Vision", "Dolby.Vision"):
            for audio, codec, channels in codecs:
                for text in (f"{vision} {audio} Atmos", f"{audio} Dolby Atmos {vision}",
                             f"💎 {vision}\n🔊 {audio} Atmos"):
                    with self.subTest(text=text):
                        self.assertEqual(matched(text), {"dolby-vision", "dolby-atmos", codec, channels})
        for text, expected in (
            ("DV", {"dolby-vision"}), ("DV Atmos", {"dolby-vision", "dolby-atmos"}),
            ("Dolby Atmos", {"dolby-atmos"}), ("DDP5.1", {"dolby-digital-plus", "51-audio"}),
            ("TrueHD7.1", {"truehd", "71-audio"}), ("DVI Atmospheric", set()),
            ("HDR10 DTS-HD.HR7.1", {"hdr10", "dts-hd-high-resolution", "71-audio"}),
            ("HDR10 DV TrueHD7.1 Atmos", {"hdr10", "dolby-vision", "truehd", "71-audio", "dolby-atmos"}),
        ):
            with self.subTest(text=text):
                self.assertEqual(matched(text), expected)
        combos = [entry for entry in DATA["filters"] if entry["id"].startswith("vis-")]
        self.assertEqual(len(combos), 4)
        self.assertTrue(all(entry["isEnabled"] is False for entry in combos))

    def test_additional_image_video_and_source_tags(self):
        for tag, group, expected in (
            ("VVC", "video-codec", "vvc"), ("H.266", "video-codec", "vvc"),
            ("VP9", "video-codec", "vp9"), ("MPEG-2", "video-codec", "mpeg-2"),
            ("AV01", "video-codec", "av1"), ("HLG", "video-tech", "hlg"),
            ("576p", "resolution", "576p-sd"), ("1080i", "resolution", "1080i-full-hd"),
            ("4320p", "resolution", "8k-ultra-hd"), ("8K", "resolution", "8k-ultra-hd"),
            ("DVD", "source", "dvd"),
        ):
            with self.subTest(tag=tag):
                self.assertEqual(matched(tag, group), {expected})
        self.assertEqual(matched("1080p UHD BluRay", "resolution"), {"1080p-full-hd"})
        self.assertEqual(matched("2160p WEBRip", "source"), {"webrip"})

    def test_generated_additions_have_alpha_channels(self):
        for name in ("dts_hd_high_resolution_audio.png", "hlg.png", "pcm.png", "5_1_2_audio.png", "1080i_full_hd.png"):
            with self.subTest(file=name):
                content = (ROOT / "Badges" / name).read_bytes()
                self.assertEqual(content[25], 6, "PNG must be RGBA for the dark TV interface")

    def test_publication_preserves_unrelated_matching_rules(self):
        legacy = json.loads((ROOT / "badges-legacy.json").read_text(encoding="utf-8"))
        self.assertEqual(DATA["groups"], legacy["groups"])
        by_id = {entry["id"]: entry for entry in DATA["filters"]}
        self.assertEqual(set(by_id), {entry["id"] for entry in legacy["filters"]} | {"ma"})
        individual_dolby = {"dolby-vision", "dolby-atmos", "dolby-digital", "dolby-digital-plus", "truehd"}
        for previous in legacy["filters"]:
            current = by_id[previous["id"]]
            ignored = {"imageURL"}
            if previous["id"].startswith("vis-"):
                ignored.add("isEnabled")
                self.assertFalse(current["isEnabled"])
            elif previous["id"] in individual_dolby:
                ignored.add("pattern")
                self.assertTrue(current["isEnabled"])
            self.assertEqual({key: value for key, value in current.items() if key not in ignored},
                             {key: value for key, value in previous.items() if key not in ignored})

    def test_only_ready_metallic_images_are_activated_and_originals_preserved(self):
        plan = json.loads((ROOT / "design" / "metallic-v2.json").read_text(encoding="utf-8"))
        by_file = {asset["file"]: asset for asset in plan["assets"]}
        self.assertEqual(len(by_file), 76)
        for entry in DATA["filters"]:
            if "/Badges/v2/" not in entry["imageURL"]:
                continue
            asset = by_file[entry["imageURL"].rsplit("/", 1)[-1]]
            with self.subTest(file=asset["file"]):
                self.assertEqual(asset["status"], "ready")
                original, optimized = ROOT / asset["original"], ROOT / asset["optimized"]
                self.assertTrue(original.is_file() and optimized.is_file())
                content = optimized.read_bytes()
                self.assertEqual(content[25], 6)
                width, height = struct.unpack(">II", content[16:24])
                self.assertLessEqual(width, 960)
                self.assertLessEqual(height, 240)
                self.assertLess(optimized.stat().st_size, original.stat().st_size)

    def test_disney_uses_the_approved_original_and_optimized_transparent_version(self):
        plan = json.loads((ROOT / "design" / "metallic-v2.json").read_text(encoding="utf-8"))
        asset = next(a for a in plan["assets"] if a["file"] == "stream-disney.png")
        self.assertEqual(asset["status"], "ready")
        self.assertNotIn("generationIssue", asset)
        self.assertTrue(asset["trimTransparent"])
        original = (ROOT / asset["original"]).read_bytes()
        self.assertEqual(hashlib.sha256(original).hexdigest(), asset["originalSHA256"])
        self.assertEqual(struct.unpack(">II", original[16:24]), (512, 512))
        optimized = (ROOT / asset["optimized"]).read_bytes()
        self.assertEqual(optimized[25], 6)
        width, height = struct.unpack(">II", optimized[16:24])
        self.assertGreater(width, height)
        self.assertEqual(height, 240)
        badge = next(f for f in DATA["filters"] if f["id"] == "dsnp")
        self.assertTrue(badge["imageURL"].endswith("/Badges/v2/stream-disney.png"))
        self.assertEqual(matched("Filme (2026) DSNP 2160p WEB-DL", "streaming"), {"dsnp"})

    def test_dolby_family_uses_one_approved_header_and_new_cache_safe_urls(self):
        plan = json.loads((ROOT / "design" / "metallic-v2.json").read_text(encoding="utf-8"))
        header = plan["dolbyHeader"]
        self.assertEqual(len(header["files"]), 8)
        self.assertTrue((ROOT / header["reference"]).is_file())
        self.assertTrue((ROOT / header["header"]).is_file())
        self.assertRegex(header["rawSHA256"], r"^[0-9a-f]{64}$")
        for filename in header["files"]:
            asset = next(a for a in plan["assets"] if a["file"] == filename)
            self.assertEqual(asset["status"], "ready")
            self.assertEqual(asset["optimized"], "Badges/v2/dolby-unified/" + filename)
            self.assertTrue((ROOT / "Originals" / "dolby-labels" / filename).is_file())
            original = (ROOT / asset["original"]).read_bytes()
            optimized = (ROOT / asset["optimized"]).read_bytes()
            self.assertEqual(struct.unpack(">II", original[16:24]), (2048, 768))
            self.assertEqual(struct.unpack(">II", optimized[16:24]), (640, 240))
            entry = next(f for f in DATA["filters"] if f["imageURL"].rsplit("/", 1)[-1] == filename)
            self.assertIn("/dolby-unified/", entry["imageURL"])

    def test_movies_anywhere_is_not_master_audio_or_a_title_word(self):
        positive = [
            "Filme (2026) MA 2160p WEB-DL DDP5.1 H.265.mkv",
            "Filme.2026.MA.2160p.WEB-DL.AAC2.0.mkv",
            "Filme (2026) Movies Anywhere 2160p WEB-DL AAC2.0.mkv",
            "Filme.2026.MoviesAnywhere.2160p.WEB-DL.AAC2.0.mkv",
            "Filme (2026) 2160p MA WEB-DL DTS-HD.MA7.1 H.265.mkv",
            "Filme (2026) 2160p WEB-DL MA DTS-HD MA 7.1 H.265.mkv",
            "Filme (2026) 2160p WEB-DL DTS-HD MA 7.1 MA H.265.mkv",
            "Show S01E01 MA 1080p WEB-DL AAC2.0.mkv",
            "🎬 Filme - (2026)\n💿 WEB-DL   📺 MA   ⚙️ H.265",
        ]
        negative = [
            "Ma (2019) 1080p WEB-DL AAC2.0.mkv",
            "Movies Anywhere (2026) 1080p WEB-DL AAC2.0.mkv",
            "Show S01E01 Ma and Dad 1080p WEB-DL AAC2.0.mkv",
            "Filme (2026) 2160p BluRay DTS-HD.MA7.1 H.265.mkv",
            "Filme (2026) 2160p BluRay DTS-HD MA 7.1 H.265.mkv",
            "Filme (2026) 2160p BluRay DTS HD   MA 7.1 H.265.mkv",
            "Filme (2026) 2160p BluRay DTS-MA 7.1 H.265.mkv",
            "Filme (2026) 2160p BluRay DTS MA 7.1 H.265.mkv",
        ]
        for text in positive:
            with self.subTest(text=text):
                self.assertEqual(matched(text, "streaming"), {"ma"})
        for text in negative:
            with self.subTest(text=text):
                self.assertNotIn("ma", matched(text, "streaming"))


if __name__ == "__main__":
    unittest.main()
