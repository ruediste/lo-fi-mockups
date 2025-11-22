package com.github.ruediste.lofi.xwiki;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;

import javax.inject.Inject;
import javax.inject.Singleton;

import org.xwiki.bridge.DocumentAccessBridge;
import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.DocumentReference;
import org.xwiki.model.reference.EntityReference;

@Component
@Singleton
public class LoFiServiceImpl implements LoFiService {

    @Inject
    private DocumentAccessBridge documentAccessBridge;

    @Override
    public String getPageImageUrl(String attachment, int pageNr) {
        var document = documentAccessBridge.getCurrentDocumentReference();
        var wiki = document.getWikiReference().getName();
        var page = String.join("/", document.getSpaceReferences().stream()
                .map(x -> URLEncoder.encode(x.getName(), StandardCharsets.UTF_8)).toList());
        return "/rest/lofimockups/page?wiki=" + URLEncoder.encode(wiki, StandardCharsets.UTF_8)
                + "&page=" + URLEncoder.encode(page, StandardCharsets.UTF_8) + "&attachment="
                + URLEncoder.encode(attachment, StandardCharsets.UTF_8)
                + "&pageNr=" + pageNr;
    }

    @Override
    public String getMockupManagementUrl() {
        return getMockupManagementUrl(documentAccessBridge.getCurrentDocumentReference());
    }

    @Override
    public String getMockupManagementUrl(DocumentReference document) {
        return this.getWebjarUrl() + "/index.html#xwiki?page=" + getPageValue(document);
    }

    @Override
    public String getMockupPlayUrl(String attachment, int pageNr) {
        return this.getWebjarUrl() + "/index.html#xwiki/play?page="
                + getPageValue(documentAccessBridge.getCurrentDocumentReference()) + "&attachment="
                + URLEncoder.encode(attachment, StandardCharsets.UTF_8) + "&pageNr=" + pageNr;
    }

    @Override
    public String getMockupEditUrl(String attachment, int pageNr) {
        return this.getWebjarUrl() + "/index.html#xwiki?page="
                + getPageValue(documentAccessBridge.getCurrentDocumentReference()) + "&attachment="
                + URLEncoder.encode(attachment, StandardCharsets.UTF_8) + "&pageNr=" + pageNr;
    }

    public String getPageValue(DocumentReference document) {
        EntityReference ref = document;
        var segments = new ArrayList<String>();
        while (ref != null) {
            String type;
            switch (ref.getType()) {
                case WIKI:
                    type = "wikis";
                    break;
                case DOCUMENT:
                    type = "pages";
                    break;
                case SPACE:
                    type = "spaces";
                    break;
                default:
                    throw new RuntimeException("Unsupported type " + ref.getType());
            }
            segments.add(type + "/" + URLEncoder.encode(ref.getName(), StandardCharsets.UTF_8));
            ref = ref.getParent();
        }
        Collections.reverse(segments);
        return URLEncoder.encode(String.join("/", segments), StandardCharsets.UTF_8);
    }

    @Override
    public String getWebjarUrl() {
        try {
            String version = new String(getClass().getClassLoader().getResourceAsStream("version.txt").readAllBytes(),
                    StandardCharsets.UTF_8);
            return "/webjars/wiki%3Axwiki/lo-fi-mockups-xwiki/" + version;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
