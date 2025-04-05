package com.github.ruediste.lofi.xwiki;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;

import org.xwiki.bridge.DocumentAccessBridge;
import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.EntityReference;
import org.xwiki.script.service.ScriptService;
import org.xwiki.wiki.descriptor.WikiDescriptorManager;
import org.xwiki.wiki.manager.WikiManagerException;

@Component
@Named("lofi")
@Singleton
public class LoFiScriptService implements ScriptService {
    @Inject
    private WikiDescriptorManager wikiDescriptorManager;

    @Inject
    private DocumentAccessBridge documentAccessBridge;

    public String getWikiId() {
        return wikiDescriptorManager.getCurrentWikiId();
    }

    public Collection<String> getAllWikiIds() throws WikiManagerException {
        return wikiDescriptorManager.getAllIds();
    }

    public String getMockupManagementUrl() {
        EntityReference ref = documentAccessBridge.getCurrentDocumentReference();
        return getMockupManagementUrl(ref);
    }

    public String getMockupManagementUrl(EntityReference ref) {
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
            segments.add(type + "/" + ref.getName());
            ref = ref.getParent();
        }
        Collections.reverse(segments);
        try {
            String version = new String(getClass().getClassLoader().getResourceAsStream("version.txt").readAllBytes(),
                    StandardCharsets.UTF_8);
            return "/webjars/wiki%3Axwiki/lo-fi-mockups-webjar/" + version + "/index.html#xwiki?page="
                    + URLEncoder.encode(String.join("/", segments), "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
