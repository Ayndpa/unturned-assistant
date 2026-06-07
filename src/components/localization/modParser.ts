import { LocalizationItem } from "./types";

/**
 * Parse the raw HTML returned by the cnapi.unbbs.net endpoint into a list of
 * `LocalizationItem` objects.
 *
 * This is extracted as a pure utility function so it can be unit-tested
 * independently of any React component.
 */
export function parseModListHtml(htmlString: string): LocalizationItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const rows = doc.querySelectorAll("table.table-hover tbody tr");

  const parsedData: LocalizationItem[] = [];

  rows.forEach((row) => {
    const tds = row.querySelectorAll("td");
    if (tds.length < 8) return; // Skip invalid / header rows

    // Status label
    const statusText = tds[0]?.querySelector(".label")?.textContent?.trim() || "正常";

    // Icon image
    const imgEl = tds[1]?.querySelector("img");
    let imgSrc = imgEl?.getAttribute("src") || "";
    if (imgSrc && !imgSrc.startsWith("http")) {
      imgSrc = `http://cnapi.unbbs.net/${imgSrc}`;
    }

    // Title & author (author is in a <small> element inside the title cell)
    const titleTd = tds[2];
    const authorEl = titleTd?.querySelector("small");
    const authorText = authorEl?.textContent?.trim() || "";

    let titleText = "";
    if (titleTd) {
      const clonedTd = titleTd.cloneNode(true) as HTMLElement;
      const smallNode = clonedTd.querySelector("small");
      if (smallNode) {
        clonedTd.removeChild(smallNode);
      }
      titleText = clonedTd.textContent?.trim() || "";
    }

    // Dates & file size
    const createdText = tds[3]?.textContent?.trim() || "";
    const updatedText = tds[4]?.textContent?.trim() || "";
    const syncText = tds[5]?.textContent?.trim() || "";
    const sizeText = tds[6]?.textContent?.trim() || "";

    // Download link
    const actionA = tds[7]?.querySelector("a");
    let downloadLink = actionA?.getAttribute("href") || "";
    if (downloadLink && !downloadLink.startsWith("http")) {
      downloadLink = `http://cnapi.unbbs.net/${downloadLink}`;
    }

    if (titleText && downloadLink) {
      parsedData.push({
        status: statusText,
        iconUrl: imgSrc,
        title: titleText,
        author: authorText.replace(/作者\s*:\s*/, ""),
        createdTime: createdText.replace(/创建时间：\s*/, ""),
        updatedTime: updatedText.replace(/最后更新时间：\s*/, ""),
        syncTime: syncText.replace(/最新同步时间：\s*/, ""),
        fileSize: sizeText.replace(/文件大小：\s*/, ""),
        downloadUrl: downloadLink,
      });
    }
  });

  return parsedData;
}
